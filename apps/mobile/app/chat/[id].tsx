import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import {
  ArrowLeft,
  Ban,
  Briefcase,
  Crown,
  FileText,
  Flag,
  Lock,
  MoreVertical,
  Paperclip,
  Send,
  X,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useChat, type ChatMessage } from '@/contexts/ChatContext';
import { useDialog } from '@/contexts/DialogContext';
import { useI18n } from '@/contexts/I18nContext';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { resolveMediaUrl } from '@/lib/useApi';
import { config } from '@/lib/config';
import { ReportSheet } from '@/components/ReportSheet';

type JobRef = { jobId: string | null; jobTitle: string | null };

type Conversation = {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerImage: string | null;
  partnerOnline: boolean;
  partnerLastSeen: string | null;
  jobId: string | null;
  jobTitle: string | null;
  jobRefs?: JobRef[];
};

type MessagesResponse = { ok: boolean; messages: ChatMessage[] };
type SendResponse = { ok: boolean; message: ChatMessage };
type ListResponse = { ok: boolean; conversations: Conversation[] };

function timeAgoShort(iso: string, t: (k: string) => string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('Mobile.chat.justNowShort');
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return t('Mobile.chat.yesterday');
  return `${days}d`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const { session } = useAuth();
  const { onMessage, isOnline, refreshUnread } = useChat();
  const dialog = useDialog();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [attachment, setAttachment] = useState<{
    uri: string;
    name: string;
    type: string;
    isImage: boolean;
  } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  async function handleBlock() {
    if (!conversation) return;
    setMenuOpen(false);
    const ok = await dialog.confirm({
      title: t('Mobile.moderation.blockConfirmTitle'),
      message: t('Mobile.moderation.blockConfirmMessage'),
      confirmLabel: t('Mobile.moderation.block'),
      cancelLabel: t('Mobile.moderation.cancel'),
      destructive: true,
    });
    if (!ok) return;
    const token = (await getToken()) ?? undefined;
    try {
      const res = await api.post<{ ok: boolean; error?: string }>(
        `/api/users/${conversation.partnerId}/block`,
        {},
        token
      );
      if (res?.ok) {
        dialog.showSuccess(t('Mobile.moderation.blockSuccess'));
        router.replace('/(tabs)/chat' as any);
      } else {
        dialog.showError(t('Mobile.common.error'));
      }
    } catch {
      dialog.showError(t('Mobile.common.error'));
    }
  }

  function openReport() {
    setMenuOpen(false);
    setReportOpen(true);
  }

  const myUserId = session?.userId;
  const isJobSeeker = session?.role === 'job-seeker';
  const isPremium = !!session?.isPremium;
  const canSend = isJobSeeker || isPremium;

  const scrollToBottom = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
    });
  }, []);

  const loadConversation = useCallback(async () => {
    const token = (await getToken()) ?? undefined;
    if (!token || !id) return;
    try {
      const res = await api.get<ListResponse>('/api/messages/conversations', token);
      if (res?.ok) {
        const c = res.conversations.find((cc) => cc.id === id);
        if (c) setConversation(c);
      }
    } catch {
      /* ignore */
    }
  }, [id]);

  const loadMessages = useCallback(async () => {
    const token = (await getToken()) ?? undefined;
    if (!token || !id) return;
    try {
      const res = await api.get<MessagesResponse>(
        `/api/messages/conversations/${id}`,
        token
      );
      if (res?.ok) {
        setMessages(res.messages ?? []);
        setTimeout(() => scrollToBottom(false), 50);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [id, scrollToBottom]);

  useEffect(() => {
    loadConversation();
    loadMessages();
    refreshUnread();
  }, [loadConversation, loadMessages, refreshUnread]);

  useEffect(() => {
    const unsub = onMessage(({ conversationId, message }) => {
      if (conversationId !== id) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      setTimeout(() => scrollToBottom(true), 50);
      getToken().then((token) => {
        if (!token) return;
        api.put(`/api/messages/conversations/${id}/read`, {}, token).catch(() => {});
        refreshUnread();
      });
    });
    return unsub;
  }, [id, onMessage, refreshUnread, scrollToBottom]);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const a = result.assets[0];
    setAttachment({
      uri: a.uri,
      name: a.fileName ?? `image-${Date.now()}.jpg`,
      type: a.mimeType ?? 'image/jpeg',
      isImage: true,
    });
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/*',
      ],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const a = result.assets[0];
    setAttachment({
      uri: a.uri,
      name: a.name ?? `file-${Date.now()}`,
      type: a.mimeType ?? 'application/octet-stream',
      isImage: (a.mimeType ?? '').startsWith('image/'),
    });
  };

  const onSend = async () => {
    const body = text.trim();
    if ((!body && !attachment) || sending || !id) return;
    if (!canSend) return;

    setSending(true);
    const token = (await getToken()) ?? undefined;
    if (!token) {
      setSending(false);
      return;
    }

    try {
      let res: SendResponse | undefined;
      if (attachment) {
        const form = new FormData();
        if (body) form.append('text', body);
        form.append('file', {
          uri: attachment.uri,
          name: attachment.name,
          type: attachment.type,
        } as any);
        res = await api.upload<SendResponse>(
          `/api/messages/conversations/${id}`,
          form,
          token
        );
      } else {
        res = await api.post<SendResponse>(
          `/api/messages/conversations/${id}`,
          { text: body },
          token
        );
      }

      if (res?.ok) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === res!.message.id)) return prev;
          return [...prev, res!.message];
        });
        setText('');
        setAttachment(null);
        setTimeout(() => scrollToBottom(true), 50);
      }
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  };

  const partnerOnline =
    conversation &&
    (isOnline(conversation.partnerId) || conversation.partnerOnline);
  const photo = resolveMediaUrl(config.apiUrl, conversation?.partnerImage ?? null);
  const initials = conversation ? getInitials(conversation.partnerName) : '';

  const refs =
    conversation?.jobRefs && conversation.jobRefs.length > 0
      ? conversation.jobRefs
      : conversation?.jobTitle
        ? [{ jobId: conversation.jobId, jobTitle: conversation.jobTitle }]
        : [];
  const visibleRefs = refs.slice(0, 3);
  const restRefs = refs.length - 3;

  const hasAnyPreview = messages.some((m) => m.isPreview);

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="border-b border-slate-100 bg-white px-4 py-3">
          <View className="flex-row items-center" style={{ gap: 12 }}>
            <Pressable
              onPress={() => router.back()}
              className="h-9 w-9 items-center justify-center rounded-lg active:bg-slate-50"
            >
              <ArrowLeft color="#94A3B8" size={20} />
            </Pressable>

            <View className="relative">
              {photo ? (
                <Image
                  source={{ uri: photo }}
                  style={{ width: 40, height: 40, borderRadius: 20 }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  className="items-center justify-center rounded-full bg-[#162C66]"
                  style={{ width: 40, height: 40 }}
                >
                  <Text className="text-[13px] font-bold text-white">
                    {initials || '…'}
                  </Text>
                </View>
              )}
              <View
                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                  partnerOnline ? 'bg-emerald-400' : 'bg-slate-300'
                }`}
              />
            </View>

            <View className="flex-1">
              <Text
                className="text-[14px] font-semibold text-[#0B1F44]"
                numberOfLines={1}
              >
                {conversation?.partnerName ?? '…'}
              </Text>
              <View className="mt-0.5 flex-row flex-wrap items-center" style={{ gap: 6 }}>
                <Text
                  className={`text-[11px] font-medium ${
                    partnerOnline ? 'text-emerald-500' : 'text-slate-400'
                  }`}
                >
                  {partnerOnline
                    ? t('Mobile.chat.online')
                    : conversation?.partnerLastSeen
                      ? `${t('Mobile.chat.lastSeenPrefix')} ${timeAgoShort(conversation.partnerLastSeen, t)}`
                      : t('Mobile.chat.offline')}
                </Text>
                {visibleRefs.length > 0 ? (
                  <View className="flex-row flex-wrap items-center" style={{ gap: 4 }}>
                    {visibleRefs.map((ref, i) => (
                      <View
                        key={i}
                        className="flex-row items-center rounded bg-[#162C66]/[0.06] px-1.5 py-0.5"
                      >
                        <Briefcase color="rgba(22,44,102,0.4)" size={9} />
                        <Text
                          className="ml-1 text-[11px] font-medium text-[#162C66]"
                          numberOfLines={1}
                          style={{ maxWidth: 120 }}
                        >
                          {ref.jobTitle}
                        </Text>
                      </View>
                    ))}
                    {restRefs > 0 ? (
                      <Text className="text-[10px] font-medium text-slate-400">
                        +{restRefs}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>

            {conversation ? (
              <Pressable
                onPress={() => setMenuOpen(true)}
                className="h-9 w-9 items-center justify-center rounded-lg active:bg-slate-50"
                accessibilityLabel={t('Mobile.moderation.report')}
              >
                <MoreVertical color="#94A3B8" size={20} />
              </Pressable>
            ) : null}
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
          className="flex-1"
        >
          {/* Messages area */}
          <View className="flex-1 bg-[#FAFAFA]">
            {loading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator color="#94A3B8" />
              </View>
            ) : (
              <FlatList
                ref={listRef}
                data={messages}
                keyExtractor={(m) => m.id}
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingTop: 20,
                  paddingBottom: 20,
                }}
                renderItem={({ item }) => (
                  <MessageBubble
                    message={item}
                    isMine={item.senderId === myUserId}
                  />
                )}
                onContentSizeChange={() => scrollToBottom(false)}
                ListFooterComponent={
                  hasAnyPreview && !isPremium && !isJobSeeker ? (
                    <View className="my-3 items-center">
                      <Pressable
                        onPress={() => router.push('/premium' as any)}
                        className="flex-row items-center rounded-xl bg-[#F5C400] px-4 py-2.5 active:opacity-90"
                        style={{
                          shadowColor: '#F5C400',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 6,
                          elevation: 3,
                        }}
                      >
                        <Crown color="#162C66" size={14} />
                        <Text className="ml-2 text-[12px] font-extrabold text-[#162C66]">
                          {t('Mobile.chat.premiumCta')}
                        </Text>
                      </Pressable>
                    </View>
                  ) : null
                }
              />
            )}
          </View>

          {/* Composer */}
          {canSend ? (
            <View className="border-t border-slate-100 bg-white px-4 py-3">
              {/* Attachment preview */}
              {attachment ? (
                <View className="mb-2 flex-row items-center" style={{ gap: 8 }}>
                  {attachment.isImage ? (
                    <Image
                      source={{ uri: attachment.uri }}
                      style={{ width: 48, height: 48, borderRadius: 8 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      className="items-center justify-center rounded-lg bg-slate-100"
                      style={{ width: 40, height: 40 }}
                    >
                      <Paperclip color="#64748B" size={16} />
                    </View>
                  )}
                  <View className="flex-1">
                    <Text
                      className="text-[12px] font-medium text-slate-700"
                      numberOfLines={1}
                    >
                      {attachment.name}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setAttachment(null)}
                    className="p-1 active:opacity-60"
                  >
                    <X color="#94A3B8" size={14} />
                  </Pressable>
                </View>
              ) : null}

              {/* Input box */}
              <View className="rounded-2xl border border-slate-200 bg-slate-50">
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder={t('Mobile.chat.typeMessage')}
                  placeholderTextColor="#94A3B8"
                  multiline
                  className="max-h-32 px-4 pb-2 pt-3 text-[14px] text-[#162C66]"
                  style={{ minHeight: 44 }}
                />
                <View className="flex-row items-center justify-between px-2 pb-2">
                  <Pressable
                    onPress={pickDocument}
                    disabled={sending}
                    className="h-8 w-8 items-center justify-center rounded-lg active:bg-amber-50 disabled:opacity-40"
                  >
                    <Paperclip color="#F5C400" size={16} />
                  </Pressable>
                  <Pressable
                    onPress={onSend}
                    disabled={(!text.trim() && !attachment) || sending}
                    className="h-9 w-9 items-center justify-center rounded-xl bg-[#162C66] active:opacity-80 disabled:opacity-30"
                  >
                    {sending ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Send color="#FFFFFF" size={15} />
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          ) : (
            <View className="border-t border-slate-100 bg-white px-5 py-4">
              <View className="items-center py-2" style={{ gap: 12 }}>
                <View className="flex-row items-center" style={{ gap: 8 }}>
                  <Lock color="#94A3B8" size={16} />
                  <Text className="text-sm font-semibold text-slate-400">
                    {t('Mobile.chat.premiumCta')}
                  </Text>
                </View>
                <Pressable
                  onPress={() => router.push('/premium' as any)}
                  className="flex-row items-center rounded-xl bg-[#F5C400] px-5 py-2.5 active:opacity-90"
                  style={{
                    shadowColor: '#F5C400',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 6,
                    elevation: 3,
                  }}
                >
                  <Crown color="#162C66" size={14} />
                  <Text className="ml-2 text-[14px] font-extrabold text-[#162C66]">
                    {t('Mobile.chat.premiumBtn')}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Header overflow-menu — Report / Block */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }}
          onPress={() => setMenuOpen(false)}
        >
          <View
            style={{
              position: 'absolute',
              top: 80,
              right: 12,
              backgroundColor: 'white',
              borderRadius: 14,
              minWidth: 200,
              paddingVertical: 6,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Pressable
              onPress={openReport}
              className="flex-row items-center px-4 py-3 active:bg-slate-50"
            >
              <Flag color="#0B1F44" size={16} />
              <Text className="ml-3 text-[14px] font-semibold text-[#0B1F44]">
                {t('Mobile.moderation.reportUser')}
              </Text>
            </Pressable>
            <View className="h-px bg-slate-100" />
            <Pressable
              onPress={handleBlock}
              className="flex-row items-center px-4 py-3 active:bg-red-50"
            >
              <Ban color="#DC2626" size={16} />
              <Text className="ml-3 text-[14px] font-semibold text-red-600">
                {t('Mobile.moderation.blockUser')}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {conversation ? (
        <ReportSheet
          visible={reportOpen}
          targetType="user"
          targetId={conversation.partnerId}
          title={t('Mobile.moderation.reportUser')}
          onClose={() => setReportOpen(false)}
        />
      ) : null}
    </View>
  );
}

function MessageBubble({
  message,
  isMine,
}: {
  message: ChatMessage;
  isMine: boolean;
}) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const fileUrl = message.fileUrl
    ? resolveMediaUrl(config.apiUrl, message.fileUrl)
    : null;
  const isImageFile = !!(fileUrl && message.fileType?.startsWith('image/'));
  const imageUrl = isImageFile ? fileUrl : null;
  const nonImageFile = !isImageFile && fileUrl ? fileUrl : null;

  const openFile = () => {
    if (nonImageFile) Linking.openURL(nonImageFile).catch(() => {});
  };

  // Preview bubble (locked)
  if (message.isPreview) {
    const textLen = message.text?.length || 0;
    const lines = textLen < 10 ? 1 : textLen < 40 ? 2 : 3;
    const widths = ['90%', '70%', '50%'];

    return (
      <View className={`mb-2 flex-row ${isMine ? 'justify-end' : 'justify-start'}`}>
        <View className="max-w-[80%]">
          <View
            className="overflow-hidden rounded-2xl rounded-bl-md border border-slate-200 bg-white"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 4,
              elevation: 1,
            }}
          >
            <Text className="px-4 pt-3 text-[14px] leading-5 text-[#333]">
              {message.text}
            </Text>
            <View className="space-y-[7px] px-4 pb-3 pt-2">
              {Array.from({ length: lines }, (_, i) => (
                <View
                  key={i}
                  className="mb-1.5 h-[10px] rounded-full bg-slate-200/70"
                  style={{ width: widths[i] as `${number}%`, opacity: 0.6 - i * 0.12 }}
                />
              ))}
            </View>
            <View className="absolute bottom-2 right-3">
              <Lock color="#CBD5E1" size={11} />
            </View>
          </View>
          <Text className="mt-1 px-1 text-[10px] text-slate-400">
            {time}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className={`mb-2 flex-row ${isMine ? 'justify-end' : 'justify-start'}`}>
      <View
        className={`max-w-[80%] ${isMine ? 'items-end' : 'items-start'}`}
      >
        <View
          className={`px-4 py-2.5 ${
            isMine
              ? 'rounded-2xl rounded-br-md bg-[#162C66]'
              : 'rounded-2xl rounded-bl-md border border-slate-100 bg-white'
          }`}
          style={
            isMine
              ? undefined
              : {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 4,
                  elevation: 1,
                }
          }
        >
          {imageUrl ? (
            <Pressable onPress={() => Linking.openURL(imageUrl).catch(() => {})}>
              <Image
                source={{ uri: imageUrl }}
                style={{ width: 240, height: 160, borderRadius: 12, marginBottom: 6 }}
                resizeMode="cover"
              />
            </Pressable>
          ) : null}
          {nonImageFile ? (
            <Pressable
              onPress={openFile}
              className={`mb-1.5 flex-row items-center rounded-lg px-3 py-2 ${
                isMine ? 'bg-white/10' : 'bg-slate-50'
              }`}
            >
              <FileText color={isMine ? '#FFFFFF' : '#162C66'} size={14} />
              <Text
                className={`ml-2 flex-1 text-[12px] font-medium ${
                  isMine ? 'text-white' : 'text-[#0B1F44]'
                }`}
                numberOfLines={1}
                style={{ maxWidth: 180 }}
              >
                {message.fileName ?? 'File'}
              </Text>
            </Pressable>
          ) : null}
          {message.text ? (
            <Text
              className={`text-[14px] leading-5 ${
                isMine ? 'text-white' : 'text-[#333]'
              }`}
            >
              {message.text}
            </Text>
          ) : null}
        </View>
        <Text className="mt-1 px-1 text-[10px] text-slate-400">
          {time}
        </Text>
      </View>
    </View>
  );
}
