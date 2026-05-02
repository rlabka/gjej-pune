'use client';

import { Search, Send, MoreVertical, Briefcase, ArrowLeft, Loader2, Building2, Paperclip, X, Crown, Lock, MapPin, Clock, User, Award } from 'lucide-react';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { HiOutlineChatBubbleLeft } from 'react-icons/hi2';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { api } from '@/lib/api';
import { getToken, getSession, getIsPremium, refreshSession } from '@/lib/auth';
import { getSocket } from '@/lib/socket';
import { Link } from '@/i18n/routing';
import { clsx } from 'clsx';
import { useCategoryHelpers, type Locale } from '@/hooks/useCategories';

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Conversation = {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerImage: string | null;
  partnerRole: string;
  partnerOnline: boolean;
  partnerLastSeen: string | null;
  jobId: string | null;
  jobTitle: string | null;
  jobRefs: { jobId: string; jobTitle: string }[];
  lastMessage: string | null;
  lastAt: string;
  unreadCount: number;
};

type Message = {
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

const loc = {
  de: {
    title: 'Nachrichten', searchPlaceholder: 'Kandidaten oder Jobs suchen...',
    emptyTitle: 'Keine Konversation ausgewählt', emptyDescription: 'Wähle eine Konversation aus der Liste, um zu schreiben.',
    noConversations: 'Noch keine Nachrichten', noConversationsDesc: 'Sobald ein Kandidat Sie kontaktiert, erscheinen die Gespräche hier.',
    messagePlaceholder: 'Nachricht eingeben...', moreOptions: 'Weitere Optionen', attachFile: 'Datei anhängen',
    filterAll: 'Alle', filterUnread: 'Ungelesen',
    premiumCta: 'Premium freischalten, um vollständige Nachrichten zu lesen', premiumBtn: 'Premium aktivieren',
  },
  en: {
    title: 'Messages', searchPlaceholder: 'Search candidates or jobs...',
    emptyTitle: 'No conversation selected', emptyDescription: 'Select a conversation from the list to start messaging.',
    noConversations: 'No messages yet', noConversationsDesc: 'When candidates contact you, conversations will appear here.',
    messagePlaceholder: 'Type your message...', moreOptions: 'More options', attachFile: 'Attach file',
    filterAll: 'All', filterUnread: 'Unread',
    premiumCta: 'Unlock Premium to read full messages', premiumBtn: 'Go Premium',
  },
  fr: {
    title: 'Messages', searchPlaceholder: 'Rechercher candidats ou emplois...',
    emptyTitle: 'Aucune conversation sélectionnée', emptyDescription: 'Sélectionnez une conversation dans la liste pour écrire.',
    noConversations: 'Pas encore de messages', noConversationsDesc: 'Lorsque des candidats vous contactent, les conversations apparaîtront ici.',
    messagePlaceholder: 'Écrire un message...', moreOptions: 'Plus d\'options', attachFile: 'Joindre un fichier',
    filterAll: 'Tous', filterUnread: 'Non lus',
    premiumCta: 'Passez Premium pour lire les messages complets', premiumBtn: 'Devenir Premium',
  },
  it: {
    title: 'Messaggi', searchPlaceholder: 'Cerca candidati o lavori...',
    emptyTitle: 'Nessuna conversazione selezionata', emptyDescription: 'Seleziona una conversazione dalla lista per scrivere.',
    noConversations: 'Ancora nessun messaggio', noConversationsDesc: 'Quando i candidati ti contattano, le conversazioni appariranno qui.',
    messagePlaceholder: 'Scrivi un messaggio...', moreOptions: 'Altre opzioni', attachFile: 'Allega file',
    filterAll: 'Tutti', filterUnread: 'Non letti',
    premiumCta: 'Attiva Premium per leggere i messaggi completi', premiumBtn: 'Attiva Premium',
  },
  sq: {
    title: 'Mesazhet', searchPlaceholder: 'Kërko kandidatë ose punë...',
    emptyTitle: 'Asnjë bisedë e zgjedhur', emptyDescription: 'Zgjidhni një bisedë nga lista për të shkruar.',
    noConversations: 'Ende pa mesazhe', noConversationsDesc: 'Kur kandidatët ju kontaktojnë, bisedat do të shfaqen këtu.',
    messagePlaceholder: 'Shkruaj mesazhin...', moreOptions: 'Opsione të tjera', attachFile: 'Bashkëngjit skedar',
    filterAll: 'Të gjitha', filterUnread: 'Të palexuara',
    premiumCta: 'Aktivizo Premium për të lexuar mesazhet e plota', premiumBtn: 'Aktivizo Premium',
  },
} as const;

function timeAgo(dateStr: string, locale: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return locale === 'de' ? 'Jetzt' : locale === 'fr' ? 'Maintenant' : locale === 'it' ? 'Ora' : locale === 'sq' ? 'Tani' : 'Now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return locale === 'de' ? 'Gestern' : locale === 'fr' ? 'Hier' : locale === 'it' ? 'Ieri' : locale === 'sq' ? 'Dje' : 'Yesterday';
  return `${days}d`;
}

export default function EmployerMessagesPage() {
  return (
    <Suspense fallback={<LoadingScreen variant="section" />}>
      <EmployerMessagesContent />
    </Suspense>
  );
}

function EmployerMessagesContent() {
  const locale = useLocale() as keyof typeof loc;
  const l = loc[locale] ?? loc.de;
  const { translateTitle } = useCategoryHelpers();
  const session = getSession();
  const myUserId = session?.userId || '';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatFilter, setChatFilter] = useState<'all' | 'unread'>('all');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isPremium, setIsPremium] = useState(getIsPremium());
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState<{ bio?: string; location?: string; experience?: any[]; education?: any[]; createdAt?: string } | null>(null);
  const [profileAds, setProfileAds] = useState<{ id: string; category: string; salary?: string; salaryType?: string; locationCity?: string; status: string; createdAt: string; currency?: string; experience?: string }[]>([]);

  // Refresh session on mount to get current isPremium from DB
  // If still false after first refresh, retry a few times (webhook may be delayed after checkout)
  useEffect(() => {
    let canceled = false;
    (async () => {
      await refreshSession();
      if (!canceled) setIsPremium(getIsPremium());
      if (!getIsPremium() && !canceled) {
        for (let i = 0; i < 3; i++) {
          await new Promise(r => setTimeout(r, 3000));
          if (canceled) return;
          await refreshSession();
          if (getIsPremium()) { setIsPremium(true); break; }
        }
      }
    })();
    return () => { canceled = true; };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
    e.target.value = '';
  };

  const loadConversations = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await api.get<{ ok: boolean; conversations: Conversation[] }>('/api/messages/conversations', token);
      if (res.ok) setConversations(res.conversations);
      else console.error('[Messages] Failed to load conversations:', res);
    } catch (err) { console.error('[Messages] Error loading conversations:', err); }
    setLoading(false);
  }, []);

  const loadMessages = useCallback(async (convId: string) => {
    const token = getToken();
    if (!token) return;
    setMessagesLoading(true);
    try {
      const res = await api.get<{ ok: boolean; messages: Message[] }>(`/api/messages/conversations/${convId}`, token);
      if (res.ok) setMessages(res.messages);
      else console.error('[Messages] Failed to load messages:', res);
    } catch (err) { console.error('[Messages] Error loading messages:', err); }
    setMessagesLoading(false);
  }, []);

  const searchParams = useSearchParams();
  const convParam = searchParams.get('conv');

  useEffect(() => {
    loadConversations().then(() => {
      if (convParam) setSelectedConvId(convParam);
    });
  }, [loadConversations, convParam]);

  useEffect(() => {
    if (selectedConvId) {
      isFirstScroll.current = true;
      loadMessages(selectedConvId).then(() => {
        window.dispatchEvent(new Event('messages:updated'));
      });
      setConversations(prev => prev.map(c => c.id === selectedConvId ? { ...c, unreadCount: 0 } : c));
    }
  }, [selectedConvId, loadMessages]);

  // Scroll to bottom — instant on first load, smooth for new incoming messages
  const isFirstScroll = useRef(true);
  useEffect(() => {
    if (messages.length === 0) return;
    if (isFirstScroll.current) {
      isFirstScroll.current = false;
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WebSocket
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (data: { conversationId: string; message: Message }) => {
      if (data.conversationId === selectedConvId) {
        let msg = data.message;
        // Apply preview/blur for non-premium employers on incoming messages (mirror backend REST logic)
        if (!isPremium && msg.senderId !== myUserId) {
          const len = msg.text?.length || 0;
          if (len < 4) {
            msg = { ...msg, isPreview: false };
          } else {
            const previewLen = len <= 20 ? Math.ceil(len * 0.6) : len <= 80 ? Math.ceil(len * 0.4) : 30;
            const previewText = msg.text && len > previewLen
              ? msg.text.substring(0, previewLen) + '\u2026'
              : msg.text;
            msg = { ...msg, text: previewText, fileUrl: null, fileName: null, fileType: null, isPreview: true };
          }
        }
        setMessages(prev => [...prev, msg]);
        const token = getToken();
        if (token) api.put(`/api/messages/conversations/${data.conversationId}/read`, {}, token).catch(() => {});
      }
      setConversations(prev => {
        const exists = prev.find(c => c.id === data.conversationId);
        if (exists) {
          return prev.map(c => c.id === data.conversationId ? {
            ...c,
            lastMessage: data.message.text || (data.message.fileName ? `📎 ${data.message.fileName}` : ''),
            lastAt: data.message.createdAt,
            unreadCount: data.conversationId === selectedConvId ? 0 : c.unreadCount + 1,
          } : c).sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
        }
        loadConversations();
        return prev;
      });
    };

    const handleOnline = (data: { userId: string }) => {
      setConversations(prev => prev.map(c => c.partnerId === data.userId ? { ...c, partnerOnline: true } : c));
    };
    const handleOffline = (data: { userId: string }) => {
      setConversations(prev => prev.map(c => c.partnerId === data.userId ? { ...c, partnerOnline: false } : c));
    };

    socket.on('message:new', handleNewMessage);
    socket.on('user:online', handleOnline);
    socket.on('user:offline', handleOffline);
    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('user:online', handleOnline);
      socket.off('user:offline', handleOffline);
    };
  }, [selectedConvId, loadConversations]);

  const handleSend = async () => {
    if ((!messageInput.trim() && !selectedFile) || !selectedConvId) return;
    const token = getToken();
    if (!token) return;
    const text = messageInput.trim();
    const file = selectedFile;
    setMessageInput('');
    setSelectedFile(null);
    setFilePreview(null);
    try {
      let res: { ok: boolean; message: Message };
      if (file) {
        const fd = new FormData();
        fd.append('text', text);
        fd.append('file', file);
        res = await api.upload<{ ok: boolean; message: Message }>(`/api/messages/conversations/${selectedConvId}`, fd, token);
      } else {
        res = await api.post<{ ok: boolean; message: Message }>(`/api/messages/conversations/${selectedConvId}`, { text }, token);
      }
      if (res.ok && res.message) {
        setMessages(prev => [...prev, res.message]);
        const displayText = text || (file ? `📎 ${file.name}` : '');
        setConversations(prev => prev.map(c => c.id === selectedConvId ? { ...c, lastMessage: displayText, lastAt: res.message.createdAt } : c));
        window.dispatchEvent(new Event('messages:updated'));
      } else {
        console.error('[Messages] Failed to send:', res);
      }
    } catch (err) { console.error('[Messages] Error sending message:', err); }
  };

  const selectedConv = conversations.find(c => c.id === selectedConvId);

  const openProfile = async () => {
    if (!selectedConv) return;
    setProfileOpen(true);
    const token = getToken();
    if (!token) return;
    try {
      const res = await api.get<{ ok: boolean; profile: any }>(`/api/users/${selectedConv.partnerId}/profile`, token);
      if (res.ok) {
        setProfileData(res.profile);
      }
    } catch { /* profile endpoint may not exist yet */ }
    try {
      const res = await api.get<{ ok: boolean; ads: any[] }>(`/api/users/${selectedConv.partnerId}/ads`, token);
      if (res.ok) setProfileAds(res.ads);
    } catch { /* ads endpoint may not exist yet */ }
  };
  const filteredConvs = conversations.filter(c => {
    if (chatFilter === 'unread' && c.unreadCount === 0) return false;
    const q = searchQuery.toLowerCase();
    return c.partnerName.toLowerCase().includes(q) ||
      (c.jobTitle || '').toLowerCase().includes(q) ||
      (c.jobRefs || []).some(r => r.jobTitle.toLowerCase().includes(q));
  });
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  if (loading) {
    return <LoadingScreen variant="section" />;
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
          <Building2 size={28} />
        </div>
        <h3 className="text-lg font-bold text-[#0B1F44] mb-1">{l.noConversations}</h3>
        <p className="text-sm text-slate-400 max-w-xs mb-4">{l.noConversationsDesc}</p>
      </div>
    );
  }

  const conversationList = (
    <div className="flex-grow overflow-y-auto">
      {filteredConvs.length === 0 ? (
        <div className="p-8 text-center"><p className="text-sm text-slate-400">{l.searchPlaceholder}</p></div>
      ) : (
        filteredConvs.map((conv) => {
          const isSelected = selectedConvId === conv.id;
          const hasUnread = !isSelected && conv.unreadCount > 0;
          const initials = conv.partnerName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
          return (
            <button
              key={conv.id}
              onClick={() => setSelectedConvId(conv.id)}
              className={clsx(
                'w-full px-4 py-3.5 text-left transition-colors duration-150 border-b border-slate-50/80',
                isSelected ? 'bg-slate-50' : 'hover:bg-slate-50/60'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  {conv.partnerImage ? (
                    <img src={conv.partnerImage.startsWith('/uploads/') ? `${API_URL}${conv.partnerImage}` : conv.partnerImage} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className={clsx(
                      'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm',
                      hasUnread ? 'bg-[#162C66] text-white' : 'bg-slate-100 text-[#162C66]'
                    )}>
                      {initials}
                    </div>
                  )}
                  <span className={clsx('absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white rounded-full', conv.partnerOnline ? 'bg-emerald-400' : 'bg-slate-300')} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <h3 className={clsx('text-[13px] truncate flex-1 min-w-0', hasUnread ? 'font-semibold text-[#0B1F44]' : 'font-medium text-slate-700')}>
                      {conv.partnerName}
                    </h3>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0 tabular-nums">{timeAgo(conv.lastAt, locale)}</span>
                  </div>
                  {(conv.jobRefs?.length > 0 || conv.jobTitle) && (() => {
                    const refs = (conv.jobRefs?.length > 0 ? conv.jobRefs : [{ jobId: conv.jobId, jobTitle: conv.jobTitle }]).slice().reverse();
                    const visible = refs.slice(0, 2);
                    const rest = refs.length - 2;
                    return (
                      <div className="flex items-center gap-1 mb-0.5">
                        <Briefcase size={11} className="text-slate-400 shrink-0" />
                        {visible.map((ref, i) => (
                          <span key={i} className="text-[11px] text-slate-500 font-medium bg-slate-50 px-1.5 py-0.5 rounded truncate max-w-[100px]">{translateTitle(ref.jobTitle || '', locale as Locale)}</span>
                        ))}
                        {rest > 0 && <span className="text-[10px] text-slate-400 font-medium">+{rest}</span>}
                      </div>
                    );
                  })()}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] text-slate-400 truncate flex-1 min-w-0">{conv.lastMessage || ''}</p>
                    {hasUnread && (
                      <span className="w-[18px] h-[18px] bg-[#162C66] text-white text-[9px] font-bold rounded-full flex items-center justify-center shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })
      )}
    </div>
  );

  const chatPanel = selectedConv ? (
    <div className="flex flex-col h-full">
      <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-white shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedConvId(null)}
              className="lg:hidden p-1.5 -ml-1 text-slate-400 hover:text-[#162C66] rounded-lg hover:bg-slate-50 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <button type="button" onClick={openProfile} className="relative cursor-pointer hover:opacity-80 transition-opacity">
              {selectedConv.partnerImage ? (
                <img src={selectedConv.partnerImage.startsWith('/uploads/') ? `${API_URL}${selectedConv.partnerImage}` : selectedConv.partnerImage} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-[#162C66] to-[#2a4a9e] text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {selectedConv.partnerName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
                </div>
              )}
              <span className={clsx('absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full', selectedConv.partnerOnline ? 'bg-emerald-400' : 'bg-slate-300')} />
            </button>
            <div className="min-w-0">
              <button type="button" onClick={openProfile} className="text-sm font-semibold text-[#0B1F44] truncate hover:text-[#162C66] hover:underline transition-colors cursor-pointer text-left">{selectedConv.partnerName}</button>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={clsx('text-[11px] font-medium', selectedConv.partnerOnline ? 'text-emerald-500' : 'text-slate-400')}>
                  {selectedConv.partnerOnline
                    ? (locale === 'de' ? 'Online' : locale === 'fr' ? 'En ligne' : locale === 'sq' ? 'Online' : 'Online')
                    : selectedConv.partnerLastSeen
                      ? `${locale === 'de' ? 'Zuletzt online' : locale === 'fr' ? 'Vu' : locale === 'sq' ? 'Parë' : 'Last seen'} ${timeAgo(selectedConv.partnerLastSeen, locale)}`
                      : (locale === 'de' ? 'Offline' : 'Offline')
                  }
                </span>
                {(selectedConv.jobRefs?.length > 0 || selectedConv.jobTitle) && (() => {
                  const refs = (selectedConv.jobRefs?.length > 0 ? selectedConv.jobRefs : [{ jobId: selectedConv.jobId, jobTitle: selectedConv.jobTitle }]).slice().reverse();
                  const visible = refs.slice(0, 3);
                  const rest = refs.length - 3;
                  return (
                    <div className="flex items-center gap-1 flex-wrap">
                      {visible.map((ref, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-[11px] text-[#162C66] font-medium bg-[#162C66]/[0.06] px-1.5 py-0.5 rounded">
                          <Briefcase size={9} className="text-[#162C66]/40" />
                          <span className="truncate max-w-[120px]">{translateTitle(ref.jobTitle || '', locale as Locale)}</span>
                        </span>
                      ))}
                      {rest > 0 && <span className="text-[10px] text-slate-400 font-medium">+{rest}</span>}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto px-5 sm:px-10 lg:px-16 py-5 sm:py-6 bg-[#FAFAFA]">
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={22} className="animate-spin text-slate-300" />
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => {
              const isOutgoing = msg.senderId === myUserId;
              const time = new Date(msg.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={msg.id} className={clsx('flex', isOutgoing ? 'justify-end' : 'justify-start')}>
                  <div className={clsx('flex flex-col max-w-[80%] sm:max-w-[70%]', isOutgoing ? 'items-end' : 'items-start')}>
                    {msg.isPreview ? (
                      <div className="relative overflow-hidden bg-white border border-slate-200/60 rounded-2xl rounded-bl-md shadow-sm max-w-[320px]">
                        <div className="px-4 pt-3 text-[14px] leading-relaxed text-[#333] select-none">
                          {msg.text}
                        </div>
                        {(() => {
                          const textLen = msg.text?.length || 0;
                          const lines = textLen < 10 ? 1 : textLen < 40 ? 2 : 3;
                          const widths = ['90%', '70%', '50%'];
                          return (
                            <div className="px-4 pt-1.5 pb-3 space-y-[7px]" aria-hidden="true">
                              {Array.from({ length: lines }, (_, i) => (
                                <div key={i} className="h-[10px] bg-slate-200/70 rounded-full" style={{ filter: `blur(${3 + i}px)`, width: widths[i] }} />
                              ))}
                            </div>
                          );
                        })()}
                        <div className="absolute bottom-2.5 right-3">
                          <Lock size={11} className="text-slate-300" />
                        </div>
                      </div>
                    ) : (
                      <div
                        className={clsx(
                          'px-4 py-2.5 text-[14px] leading-relaxed',
                          isOutgoing
                            ? 'bg-[#162C66] text-white rounded-2xl rounded-br-md'
                            : 'bg-white text-[#333] border border-slate-100 rounded-2xl rounded-bl-md shadow-sm'
                        )}
                      >
                        {msg.fileUrl && msg.fileType?.startsWith('image/') && (
                          <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${msg.fileUrl}`} target="_blank" rel="noopener noreferrer">
                            <img src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${msg.fileUrl}`} alt={msg.fileName || ''} className="max-w-[240px] rounded-lg mb-1.5" />
                          </a>
                        )}
                        {msg.fileUrl && !msg.fileType?.startsWith('image/') && (
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${msg.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={clsx('flex items-center gap-2 mb-1.5 px-3 py-2 rounded-lg text-xs font-medium', isOutgoing ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-50 hover:bg-slate-100')}
                          >
                            <Paperclip size={14} />
                            <span className="truncate max-w-[180px]">{msg.fileName || 'File'}</span>
                          </a>
                        )}
                        {msg.text && <span>{msg.text}</span>}
                      </div>
                    )}
                    <span className="mt-1 text-[10px] text-slate-400 px-1">{time}</span>
                  </div>
                </div>
              );
            })}
            {messages.some(m => m.isPreview) && (
              <div className="flex justify-center py-3">
                <Link
                  href="/dashboard/employer/premium"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#F5C400] to-[#FFD740] text-[#162C66] text-xs font-bold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
                >
                  <Crown size={14} />
                  {l.premiumCta}
                </Link>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input — show only if premium (employers must pay to message) */}
      {isPremium ? (
      <div className="border-t border-slate-100 bg-white px-5 sm:px-6 py-3 shrink-0">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl focus-within:border-[#162C66]/30 focus-within:bg-white focus-within:shadow-sm transition-all">
          <textarea
            rows={2}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !(typeof window !== 'undefined' && 'ontouchstart' in window)) { e.preventDefault(); handleSend(); } }}
            placeholder={l.messagePlaceholder}
            className="w-full min-h-[56px] max-h-32 px-4 pt-3 pb-2 bg-transparent text-sm text-[#162C66] placeholder:text-slate-400 resize-none outline-none"
          />
          <div className="flex items-center justify-between px-2 pb-2">
            <label className="w-8 h-8 flex items-center justify-center rounded-lg text-[#F5C400] hover:text-[#e0b200] hover:bg-yellow-50 transition-colors cursor-pointer" title={l.attachFile}>
              <input type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.txt" onChange={(e) => handleFileSelect(e)} />
              <Paperclip size={16} />
            </label>
            <button
              type="button"
              disabled={!messageInput.trim() && !selectedFile}
              className="shrink-0 w-9 h-9 bg-[#162C66] text-white rounded-xl flex items-center justify-center hover:bg-[#0F1E45] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              onClick={handleSend}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
        {selectedFile && (
          <div className="mt-2 flex items-center gap-2 px-1">
            {selectedFile.type.startsWith('image/') ? (
              <img src={filePreview!} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                <Paperclip size={16} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-700 truncate">{selectedFile.name}</p>
              <p className="text-[10px] text-slate-400">{(selectedFile.size / 1024).toFixed(0)} KB</p>
            </div>
            <button type="button" onClick={() => { setSelectedFile(null); setFilePreview(null); }} className="text-slate-400 hover:text-red-500 transition-colors p-1">
              <X size={14} />
            </button>
          </div>
        )}
      </div>
      ) : (
      <div className="border-t border-slate-100 bg-white px-5 sm:px-6 py-4 shrink-0">
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="flex items-center gap-2 text-slate-400">
            <Lock size={16} />
            <span className="text-sm font-semibold">{l.premiumCta}</span>
          </div>
          <Link
            href="/dashboard/employer/premium"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#F5C400] to-[#FFD740] text-[#162C66] text-sm font-bold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
          >
            <Crown size={14} />
            {l.premiumBtn}
          </Link>
        </div>
      </div>
      )}
    </div>
  ) : (
    <div className="flex-grow flex flex-col items-center justify-center p-8 text-center">
      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
        <HiOutlineChatBubbleLeft className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-[#0B1F44] mb-1">{l.emptyTitle}</h3>
      <p className="text-sm text-slate-400 max-w-xs">{l.emptyDescription}</p>
    </div>
  );

  return (
    <>
    {/* Profile Dialog */}
    {profileOpen && selectedConv && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setProfileOpen(false)}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
          {/* Header with gradient */}
          <div className="relative bg-gradient-to-br from-[#162C66] to-[#1a3a7a] px-6 pt-8 pb-14">
            <button type="button" onClick={() => setProfileOpen(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
              <X size={16} />
            </button>
            <div className="flex items-center gap-1.5">
              <span className={clsx('w-2.5 h-2.5 rounded-full', selectedConv.partnerOnline ? 'bg-emerald-400' : 'bg-slate-400')} />
              <span className="text-xs text-white/70 font-medium">
                {selectedConv.partnerOnline
                  ? 'Online'
                  : selectedConv.partnerLastSeen
                    ? `${{ de: 'Zuletzt online', en: 'Last seen', fr: 'Vu', it: 'Visto', sq: 'Parë' }[locale]} ${timeAgo(selectedConv.partnerLastSeen, locale)}`
                    : 'Offline'
                }
              </span>
            </div>
          </div>

          {/* Profile picture + name overlay */}
          <div className="relative px-6 -mt-10 mb-3">
            <div className="flex items-end gap-4">
              {selectedConv.partnerImage ? (
                <img src={selectedConv.partnerImage.startsWith('/uploads/') ? `${API_URL}${selectedConv.partnerImage}` : selectedConv.partnerImage} alt="" className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg" />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-[#162C66] to-[#2a4a9e] text-white rounded-2xl flex items-center justify-center font-bold text-xl border-4 border-white shadow-lg">
                  {selectedConv.partnerName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="pb-1 min-w-0">
                <h3 className="text-lg font-bold text-[#0B1F44] truncate">{selectedConv.partnerName}</h3>
                {profileData?.location && (
                  <p className="flex items-center gap-1 text-xs text-slate-400">
                    <MapPin size={11} /> {profileData.location}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {profileData?.bio && (
            <div className="px-6 mb-4">
              <p className="text-[13px] text-slate-600 leading-relaxed">{profileData.bio}</p>
            </div>
          )}

          {/* Member since */}
          {profileData?.createdAt && (
            <div className="px-6 mb-4 flex items-center gap-1.5 text-[11px] text-slate-400">
              <Clock size={11} />
              <span>{{ de: 'Mitglied seit', en: 'Member since', fr: 'Membre depuis', it: 'Membro dal', sq: 'Anëtar që nga' }[locale]} {new Date(profileData.createdAt).toLocaleDateString({ de: 'de-CH', en: 'en', fr: 'fr-CH', it: 'it-CH', sq: 'sq' }[locale], { month: 'long', year: 'numeric' })}</span>
            </div>
          )}

          {/* Job Ads */}
          <div className="flex-1 overflow-y-auto border-t border-slate-100">
            <div className="px-6 py-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                {{ de: 'Kandidaten-Profile', en: 'Candidate Profiles', fr: 'Profils candidats', it: 'Profili candidati', sq: 'Profilet e kandidatëve' }[locale]} {profileAds.length > 0 && `(${profileAds.length})`}
              </h4>
              {profileAds.length === 0 ? (
                <div className="text-center py-6">
                  <User size={20} className="text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">{{ de: 'Keine Profile vorhanden', en: 'No profiles available', fr: 'Aucun profil disponible', it: 'Nessun profilo disponibile', sq: 'Asnjë profil i disponueshëm' }[locale]}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {profileAds.map((ad) => (
                    <div key={ad.id} className={clsx(
                      'relative p-3.5 rounded-lg border transition-colors',
                      ad.status === 'Active'
                        ? 'border-emerald-200/60 bg-emerald-50/30 hover:bg-emerald-50/50'
                        : 'border-slate-200/60 bg-slate-50/40 hover:bg-slate-50/70'
                    )}>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="text-[13px] font-semibold text-[#0B1F44] leading-snug">{translateTitle(ad.category, locale as Locale)}</p>
                        <span className={clsx(
                          'shrink-0 w-1.5 h-1.5 rounded-full mt-1.5',
                          ad.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'
                        )} title={ad.status === 'Active' ? ({ de: 'Aktiv', en: 'Active', fr: 'Actif', it: 'Attivo', sq: 'Aktiv' }[locale]) : ad.status} />
                      </div>
                      <div className="flex items-center gap-2.5 text-[11px] text-slate-500">
                        {ad.locationCity && <span className="flex items-center gap-1"><MapPin size={10} className="text-slate-400" />{ad.locationCity}</span>}
                        {ad.experience && <span className="flex items-center gap-1 font-medium text-[#0B1F44]/70"><Award size={10} className="text-slate-400" />{ad.experience}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}

    <div className="h-full flex overflow-hidden bg-white lg:bg-transparent">
      <div className={clsx(
        'flex flex-col bg-white border-r border-slate-100 overflow-hidden',
        'w-full lg:w-[340px] lg:shrink-0 lg:rounded-l-2xl lg:border lg:border-slate-100',
        selectedConvId !== null && 'hidden lg:flex'
      )}>
        <div className="px-4 pt-5 pb-3 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-semibold text-[#0B1F44] mb-3">{l.title}</h2>
          <div className="relative mb-2.5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={l.searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:border-[#162C66]/30 focus:bg-white outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setChatFilter('all')}
              className={clsx('px-3 py-1 rounded-full text-xs font-medium transition-colors', chatFilter === 'all' ? 'bg-[#162C66] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')}
            >
              {l.filterAll}
            </button>
            <button
              type="button"
              onClick={() => setChatFilter('unread')}
              className={clsx('px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5', chatFilter === 'unread' ? 'bg-[#162C66] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')}
            >
              {l.filterUnread}
              {totalUnread > 0 && (
                <span className={clsx('w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center', chatFilter === 'unread' ? 'bg-white text-[#162C66]' : 'bg-[#162C66] text-white')}>
                  {totalUnread}
                </span>
              )}
            </button>
          </div>
        </div>
        {conversationList}
      </div>

      <div className={clsx(
        'flex-1 flex flex-col bg-white overflow-hidden',
        'lg:rounded-r-2xl lg:border-t lg:border-r lg:border-b lg:border-slate-100',
        selectedConvId === null && 'hidden lg:flex'
      )}>
        {chatPanel}
      </div>
    </div>
    </>
  );
}
