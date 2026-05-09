import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Camera,
  ChevronRight,
  Lock,
  ShieldOff,
  Trash2,
  User as UserIcon,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useDialog } from '@/contexts/DialogContext';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { resolveMediaUrl } from '@/lib/useApi';
import { config } from '@/lib/config';
import { FormField } from '@/components/FormField';

type Profile = {
  id: string;
  displayName: string | null;
  email: string;
  phone: string | null;
  role: string;
  image: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  settings: {
    emailNotifications: boolean;
    interviewReminders: boolean;
    newMessageAlerts: boolean;
  } | null;
};

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const dialog = useDialog();
  const { session, refresh, logout } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');

  // Notification toggles
  const [emailNotif, setEmailNotif] = useState(true);
  const [interviewNotif, setInterviewNotif] = useState(true);
  const [messageNotif, setMessageNotif] = useState(true);

  // Change password
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  // Delete account
  const [deletePw, setDeletePw] = useState('');
  const [deleting, setDeleting] = useState(false);

  const loadProfile = useCallback(async () => {
    const token = (await getToken()) ?? undefined;
    if (!token) return;
    try {
      const res = await api.get<{ ok: boolean; profile: Profile }>(
        '/api/settings/profile',
        token
      );
      if (res?.ok && res.profile) {
        const p = res.profile;
        setProfile(p);
        setDisplayName(p.displayName ?? '');
        setPhone(p.phone ?? '');
        setBio(p.bio ?? '');
        setLocation(p.location ?? '');
        setWebsite(p.website ?? '');
        setEmailNotif(p.settings?.emailNotifications ?? true);
        setInterviewNotif(p.settings?.interviewReminders ?? true);
        setMessageNotif(p.settings?.newMessageAlerts ?? true);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function onSave() {
    setSaving(true);
    const token = (await getToken()) ?? undefined;
    if (!token) {
      setSaving(false);
      return;
    }
    try {
      // Update profile
      const res = await api.put<{ ok: boolean; user: Profile }>(
        '/api/settings/profile',
        { displayName, phone, bio, location, website },
        token
      );
      if (!res?.ok) throw new Error('update failed');

      // Update notification settings
      await api.put(
        '/api/settings/notifications',
        {
          emailNotifications: emailNotif,
          interviewReminders: interviewNotif,
          newMessageAlerts: messageNotif,
        },
        token
      );

      // Refresh auth session so displayName etc. update everywhere
      await refresh();
      dialog.showSuccess(t('Mobile.common.done'));
    } catch {
      dialog.showError(t('Mobile.common.error'));
    } finally {
      setSaving(false);
    }
  }

  async function pickAvatar() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];

    const token = (await getToken()) ?? undefined;
    if (!token) return;

    const form = new FormData();
    form.append('image', {
      uri: asset.uri,
      name: asset.fileName ?? `avatar-${Date.now()}.jpg`,
      type: asset.mimeType ?? 'image/jpeg',
    } as any);

    try {
      const res = await api.upload<{ ok: boolean; image: string }>(
        '/api/settings/profile-image',
        form,
        token
      );
      if (res?.ok && res.image) {
        setProfile((prev) => (prev ? { ...prev, image: res.image } : prev));
        await refresh();
      }
    } catch {
      dialog.showError(t('Mobile.common.error'));
    }
  }

  const avatarUrl = resolveMediaUrl(config.apiUrl, profile?.image ?? null);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#162C66" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* Blue header */}
      <View className="bg-[#162C66] pb-6 pt-2">
        <SafeAreaView edges={['top']}>
          <View className="flex-row items-center px-4 pt-2">
            <Pressable onPress={() => router.back()} className="p-2">
              <ArrowLeft color="#FFFFFF" size={22} />
            </Pressable>
            <Text className="ml-2 text-xl font-extrabold text-white">
              {t('Mobile.profile.settings')}
            </Text>
          </View>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 -mt-3 px-6"
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 120 }}
        >
          {/* Avatar */}
          <Pressable
            onPress={pickAvatar}
            className="mb-5 items-center self-center"
          >
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                className="h-24 w-24 rounded-full"
              />
            ) : (
              <View className="h-24 w-24 items-center justify-center rounded-full bg-white border-2 border-slate-200">
                <UserIcon color="#162C66" size={32} />
              </View>
            )}
            <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full bg-[#F5C400]">
              <Camera color="#0B1F44" size={14} />
            </View>
          </Pressable>

          {/* Profile fields */}
          <SectionTitle title={t('Mobile.profile.title')} />
          <FormField
            label={t('Mobile.auth.displayName')}
            value={displayName}
            onChangeText={setDisplayName}
          />
          <FormField
            label={t('Mobile.ad.phone')}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <FormField
            label="Bio"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={3}
          />
          <FormField
            label={t('Mobile.ad.livingPlace')}
            value={location}
            onChangeText={setLocation}
          />
          <FormField
            label="Website"
            value={website}
            onChangeText={setWebsite}
            keyboardType="url"
            autoCapitalize="none"
          />

          {/* Notification toggles */}
          <SectionTitle title={t('Mobile.profile.notifications')} />
          <View className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <ToggleRow
              label="E-Mail"
              value={emailNotif}
              onChange={setEmailNotif}
            />
            <View className="h-px bg-slate-100" />
            <ToggleRow
              label="Interview Reminders"
              value={interviewNotif}
              onChange={setInterviewNotif}
            />
            <View className="h-px bg-slate-100" />
            <ToggleRow
              label={t('Mobile.chat.title')}
              value={messageNotif}
              onChange={setMessageNotif}
            />
          </View>

          {/* Save */}
          <Pressable
            onPress={onSave}
            disabled={saving}
            className="mt-6 rounded-xl bg-[#162C66] py-4 active:opacity-80 disabled:opacity-50"
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-center text-base font-bold text-white">
                {t('Mobile.common.save')}
              </Text>
            )}
          </Pressable>

          {/* Change password */}
          <SectionTitle title={t('Mobile.profile.changePassword')} />
          <View className="rounded-2xl border border-slate-200 bg-white p-4">
            <View className="flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-3 mb-3">
              <Lock color="#64748B" size={16} />
              <TextInput
                value={currentPw}
                onChangeText={setCurrentPw}
                secureTextEntry
                placeholder="Current password"
                placeholderTextColor="#94A3B8"
                className="ml-2 flex-1 py-3 text-[14px] text-[#0B1F44]"
              />
            </View>
            <View className="flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-3">
              <Lock color="#64748B" size={16} />
              <TextInput
                value={newPw}
                onChangeText={setNewPw}
                secureTextEntry
                placeholder="New password (min. 6)"
                placeholderTextColor="#94A3B8"
                className="ml-2 flex-1 py-3 text-[14px] text-[#0B1F44]"
              />
            </View>
            <Pressable
              onPress={async () => {
                if (!currentPw || newPw.length < 6) {
                  dialog.showError(t('Mobile.common.error'));
                  return;
                }
                setChangingPw(true);
                const token = (await getToken()) ?? undefined;
                try {
                  const res = await api.put<{ ok?: boolean; error?: string }>(
                    '/api/settings/password',
                    { currentPassword: currentPw, newPassword: newPw },
                    token
                  );
                  if (res?.ok) {
                    dialog.showSuccess(t('Mobile.common.done'));
                    setCurrentPw('');
                    setNewPw('');
                  } else {
                    dialog.showError(res?.error ?? t('Mobile.common.error'));
                  }
                } catch {
                  dialog.showError(t('Mobile.common.error'));
                } finally {
                  setChangingPw(false);
                }
              }}
              disabled={changingPw || !currentPw || newPw.length < 6}
              className="mt-3 rounded-xl bg-[#162C66] py-3 active:opacity-80 disabled:opacity-50"
            >
              {changingPw ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-center text-[13px] font-bold text-white">
                  {t('Mobile.profile.changePassword')}
                </Text>
              )}
            </Pressable>
          </View>

          {/* Privacy & Safety — App Store Review Guideline 1.2 (UGC) */}
          <SectionTitle title={t('Mobile.moderation.privacySafety')} />
          <Pressable
            onPress={() => router.push('/blocked-users' as any)}
            className="flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 active:opacity-80"
          >
            <View className="flex-row items-center">
              <ShieldOff color="#162C66" size={18} />
              <Text className="ml-3 text-[14px] font-bold text-[#0B1F44]">
                {t('Mobile.moderation.blockedUsers')}
              </Text>
            </View>
            <ChevronRight color="#94A3B8" size={18} />
          </Pressable>

          {/* Delete account */}
          <SectionTitle title={t('Mobile.profile.deleteAccount')} />
          <View className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <View className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3">
              <Lock color="#DC2626" size={16} />
              <TextInput
                value={deletePw}
                onChangeText={setDeletePw}
                secureTextEntry
                placeholder="Password"
                placeholderTextColor="#94A3B8"
                className="ml-2 flex-1 py-3 text-[14px] text-[#0B1F44]"
              />
            </View>
            <Pressable
              onPress={async () => {
                if (!deletePw) return;
                const ok = await dialog.confirm({
                  title: t('Mobile.profile.deleteAccount'),
                  message: t('Mobile.adForm.deleteConfirm'),
                  confirmLabel: t('Mobile.common.confirm'),
                  cancelLabel: t('Mobile.common.cancel'),
                  destructive: true,
                });
                if (!ok) return;
                setDeleting(true);
                const token = (await getToken()) ?? undefined;
                try {
                  const res = await api.post<{ ok?: boolean; error?: string }>(
                    '/api/settings/delete-account',
                    { password: deletePw },
                    token
                  );
                  if (res?.ok) {
                    await logout();
                    router.replace('/welcome' as any);
                  } else {
                    dialog.showError(res?.error ?? t('Mobile.common.error'));
                  }
                } catch {
                  dialog.showError(t('Mobile.common.error'));
                } finally {
                  setDeleting(false);
                }
              }}
              disabled={deleting || !deletePw}
              className="mt-3 flex-row items-center justify-center rounded-xl border border-red-300 bg-white py-3 active:opacity-80 disabled:opacity-50"
            >
              {deleting ? (
                <ActivityIndicator color="#DC2626" size="small" />
              ) : (
                <>
                  <Trash2 color="#DC2626" size={16} />
                  <Text className="ml-2 text-[13px] font-bold text-red-600">
                    {t('Mobile.profile.deleteAccount')}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Text className="mb-2 mt-4 text-[13px] font-extrabold uppercase tracking-wider text-slate-400">
      {title}
    </Text>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3">
      <Text className="text-[14px] font-semibold text-[#0B1F44]">{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#D1D5DB', true: '#162C66' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}
