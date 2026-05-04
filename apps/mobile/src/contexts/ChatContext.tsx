import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Socket } from 'socket.io-client';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useAuth } from './AuthContext';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import {
  registerForPushNotifications,
  unregisterPushToken,
} from '@/lib/push';

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  read: boolean;
  createdAt: string;
  isPreview?: boolean;
};

type IncomingHandler = (payload: {
  conversationId: string;
  message: ChatMessage;
}) => void;

type ChatState = {
  socket: Socket | null;
  onlineUsers: Set<string>;
  isOnline: (userId: string) => boolean;
  unreadCount: number;
  refreshUnread: () => Promise<void>;
  /** Subscribe to incoming message:new events. Returns an unsubscribe fn. */
  onMessage: (handler: IncomingHandler) => () => void;
};

const ChatContext = createContext<ChatState | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const handlersRef = useRef<Set<IncomingHandler>>(new Set());
  const pushTokenRef = useRef<string | null>(null);

  const refreshUnread = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await api.get<{ ok: boolean; count: number }>(
        '/api/messages/unread-count',
        token
      );
      if (res?.ok) setUnreadCount(res.count ?? 0);
    } catch {
      /* ignore */
    }
  }, []);

  // Connect / disconnect socket based on auth state
  useEffect(() => {
    let cancelled = false;

    async function connect() {
      if (!session) {
        disconnectSocket();
        setSocket(null);
        setOnlineUsers(new Set());
        setUnreadCount(0);
        return;
      }

      const s = await getSocket();
      if (cancelled || !s) return;
      setSocket(s);

      const onUserOnline = ({ userId }: { userId: string }) => {
        setOnlineUsers((prev) => {
          if (prev.has(userId)) return prev;
          const next = new Set(prev);
          next.add(userId);
          return next;
        });
      };
      const onUserOffline = ({ userId }: { userId: string }) => {
        setOnlineUsers((prev) => {
          if (!prev.has(userId)) return prev;
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      };
      const onMessageNew = (payload: {
        conversationId: string;
        message: ChatMessage;
      }) => {
        setUnreadCount((c) => c + 1);
        handlersRef.current.forEach((h) => {
          try {
            h(payload);
          } catch {
            /* ignore handler errors */
          }
        });
      };

      s.on('user:online', onUserOnline);
      s.on('user:offline', onUserOffline);
      s.on('message:new', onMessageNew);

      // Initial unread count
      refreshUnread();

      // Register this device for push notifications (idempotent server-side)
      registerForPushNotifications()
        .then((token) => {
          if (token) pushTokenRef.current = token;
        })
        .catch(() => {});
    }

    connect();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.userId]);

  // Handle push notification taps → navigate by type.
  // Routing here mirrors apps/mobile/app/(tabs)/notifications.tsx onTap so
  // tap-from-push and tap-from-inbox land in the same place.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as
        | {
            type?: string;
            conversationId?: string;
            targetType?: string;
            targetId?: string;
          }
        | undefined;
      if (!data?.type) return;
      switch (data.type) {
        case 'message':
          if (data.conversationId) {
            router.push(`/chat/${data.conversationId}` as any);
          }
          break;
        case 'profile_view':
          // Always route to the dedicated screen (premium-gated UI handles
          // both states — premium sees viewers, non-premium sees upgrade CTA).
          router.push('/profile-views' as any);
          break;
        case 'premium_activated':
        case 'premium_cancelled':
        case 'boost_active':
          router.push('/premium' as any);
          break;
        case 'new_match':
          // Deep-link straight to the matched job/ad detail
          if (data.targetType === 'ad' && data.targetId) {
            router.push(`/ad/${data.targetId}` as any);
          } else if (data.targetType === 'job' && data.targetId) {
            router.push(`/job/${data.targetId}` as any);
          }
          break;
      }
    });
    return () => sub.remove();
  }, []);

  // Disconnect entirely on logout
  useEffect(() => {
    if (!session) {
      // Unregister push token *before* we drop the auth token
      if (pushTokenRef.current) {
        const tok = pushTokenRef.current;
        pushTokenRef.current = null;
        unregisterPushToken(tok).catch(() => {});
      }
      disconnectSocket();
      setSocket(null);
      setOnlineUsers(new Set());
      setUnreadCount(0);
    }
  }, [session]);

  const isOnline = useCallback(
    (userId: string) => onlineUsers.has(userId),
    [onlineUsers]
  );

  const onMessage = useCallback((handler: IncomingHandler) => {
    handlersRef.current.add(handler);
    return () => {
      handlersRef.current.delete(handler);
    };
  }, []);

  const value = useMemo<ChatState>(
    () => ({
      socket,
      onlineUsers,
      isOnline,
      unreadCount,
      refreshUnread,
      onMessage,
    }),
    [socket, onlineUsers, isOnline, unreadCount, refreshUnread, onMessage]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatState {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
