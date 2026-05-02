import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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
  CheckCircle2,
  ChevronDown,
  Circle,
  Save,
  UserCog,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useDialog } from '@/contexts/DialogContext';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { resolveMediaUrl } from '@/lib/useApi';
import { config } from '@/lib/config';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';

type Profile = {
  id: string;
  displayName: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
};

const PHONE_PREFIXES = [
  { code: '+41', flag: '🇨🇭', label: 'CH' },
  { code: '+49', flag: '🇩🇪', label: 'DE' },
  { code: '+43', flag: '🇦🇹', label: 'AT' },
  { code: '+33', flag: '🇫🇷', label: 'FR' },
  { code: '+39', flag: '🇮🇹', label: 'IT' },
  { code: '+355', flag: '🇦🇱', label: 'AL' },
  { code: '+383', flag: '🇽🇰', label: 'XK' },
  { code: '+389', flag: '🇲🇰', label: 'MK' },
  { code: '+44', flag: '🇬🇧', label: 'GB' },
  { code: '+1', flag: '🇺🇸', label: 'US' },
];

export default function ProfileEditScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const dialog = useDialog();
  const { refresh } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('+41');
  const [phone, setPhone] = useState('');
  const [profileLocation, setProfileLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [image, setImage] = useState<string | null>(null);

  const [prefixOpen, setPrefixOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const token = (await getToken()) ?? undefined;
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get<{ ok: boolean; profile: Profile }>(
          '/api/settings/profile',
          token
        );
        if (res?.ok && res.profile) {
          const p = res.profile;
          setDisplayName(p.displayName ?? '');
          setEmail(p.email ?? '');
          const stored = p.phone ?? '';
          const match = PHONE_PREFIXES.find((pr) => stored.startsWith(pr.code));
          if (match) {
            setPhonePrefix(match.code);
            setPhone(stored.slice(match.code.length).trim());
          } else {
            setPhone(stored);
          }
          setProfileLocation(p.location ?? '');
          setWebsite(p.website ?? '');
          setImage(p.image ?? null);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const completion = useMemo(() => {
    let score = 0;
    if (displayName) score++;
    if (email) score++;
    if (phone) score++;
    if (profileLocation) score++;
    if (image) score++;
    return Math.round((score / 5) * 100);
  }, [displayName, email, phone, profileLocation, image]);

  const onSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const token = (await getToken()) ?? undefined;
      if (!token) return;
      const fullPhone = phone.trim() ? `${phonePrefix} ${phone.trim()}` : '';
      await api.put(
        '/api/settings/profile',
        {
          displayName,
          email,
          phone: fullPhone,
          location: profileLocation,
          website,
        },
        token
      );
      await refresh();
      dialog.showSuccess(t('Mobile.profileEdit.saved'));
    } catch {
      dialog.showError(t('Mobile.common.error'));
    } finally {
      setSaving(false);
    }
  }, [
    saving,
    phone,
    phonePrefix,
    displayName,
    email,
    profileLocation,
    website,
    t,
    refresh,
  ]);

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

    setImageUploading(true);
    try {
      const res = await api.upload<{ ok: boolean; image: string }>(
        '/api/settings/profile-image',
        form,
        token
      );
      if (res?.ok && res.image) {
        setImage(res.image);
        await refresh();
      }
    } catch {
      dialog.showError(t('Mobile.common.error'));
    } finally {
      setImageUploading(false);
    }
  }

  const avatarUrl = resolveMediaUrl(config.apiUrl, image);
  const initials = (displayName || email || '?').charAt(0).toUpperCase();

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
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="flex-row items-center px-4 pb-1 pt-2">
          <Pressable
            onPress={() => router.back()}
            className="h-9 w-9 items-center justify-center rounded-xl active:opacity-70"
          >
            <ArrowLeft color="#0B1F44" size={22} />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 100 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View className="px-6 pt-1">
              <View className="flex-row items-center">
                <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-[#162C66]">
                  <UserCog color="#F5C400" size={20} />
                </View>
                <View className="flex-1 pt-0.5">
                  <Text className="text-2xl font-extrabold text-[#0B1F44]">
                    {t('Mobile.profileEdit.title')}
                  </Text>
                </View>
              </View>
              <Text className="mt-2 text-[13px] text-slate-500">
                {t('Mobile.profileEdit.subtitle')}
              </Text>
            </View>

            {/* Profile Card */}
            <View className="mx-4 mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <View className="h-1 bg-[#162C66]" />

              <View className="flex-row items-center p-5">
                <Pressable onPress={pickAvatar} className="relative">
                  {avatarUrl ? (
                    <Image
                      source={{ uri: avatarUrl }}
                      className="h-20 w-20 rounded-2xl"
                    />
                  ) : (
                    <View className="h-20 w-20 items-center justify-center rounded-2xl bg-[#162C66]">
                      <Text className="text-2xl font-extrabold text-white">
                        {initials}
                      </Text>
                    </View>
                  )}
                  <View className="absolute -bottom-1 -right-1 h-7 w-7 items-center justify-center rounded-full bg-[#F5C400] border-2 border-white">
                    {imageUploading ? (
                      <ActivityIndicator color="#0B1F44" size="small" />
                    ) : (
                      <Camera color="#0B1F44" size={12} />
                    )}
                  </View>
                </Pressable>
                <View className="ml-4 flex-1">
                  <Text
                    className="text-base font-bold text-[#0B1F44]"
                    numberOfLines={1}
                  >
                    {displayName || '—'}
                  </Text>
                  <Text
                    className="mt-0.5 text-[12px] text-slate-500"
                    numberOfLines={1}
                  >
                    {email || '—'}
                  </Text>
                  <Pressable onPress={pickAvatar}>
                    <Text className="mt-1 text-[11px] font-bold text-[#162C66]">
                      {t('Mobile.profileEdit.changePhoto')}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Form */}
              <View className="px-5 pb-5" style={{ gap: 14 }}>
                <Field
                  label={t('Mobile.profileEdit.displayName')}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder={t('Mobile.profileEdit.displayNamePh')}
                />
                <Field
                  label={t('Mobile.profileEdit.email')}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('Mobile.profileEdit.emailPh')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                {/* Phone with prefix */}
                <View>
                  <Text className="mb-1.5 text-[13px] font-bold text-slate-700">
                    {t('Mobile.profileEdit.phone')}
                  </Text>
                  <View className="flex-row" style={{ gap: 8 }}>
                    <View className="w-[110px]">
                      <Pressable
                        onPress={() => setPrefixOpen((v) => !v)}
                        className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 active:opacity-80"
                      >
                        <Text className="text-[13px] font-semibold text-[#0B1F44]">
                          {PHONE_PREFIXES.find((p) => p.code === phonePrefix)?.flag}{' '}
                          {phonePrefix}
                        </Text>
                        <ChevronDown color="#94A3B8" size={14} />
                      </Pressable>
                    </View>
                    <View className="flex-1">
                      <TextInput
                        value={phone}
                        onChangeText={setPhone}
                        placeholder={t('Mobile.profileEdit.phonePh')}
                        placeholderTextColor="#94A3B8"
                        keyboardType="phone-pad"
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] text-[#0B1F44]"
                      />
                    </View>
                  </View>
                  {prefixOpen ? (
                    <View className="mt-2 rounded-xl border border-slate-200 bg-white">
                      {PHONE_PREFIXES.map((p, idx) => (
                        <Pressable
                          key={p.code}
                          onPress={() => {
                            setPhonePrefix(p.code);
                            setPrefixOpen(false);
                          }}
                          className={`flex-row items-center px-4 py-2.5 active:bg-slate-50 ${
                            idx < PHONE_PREFIXES.length - 1
                              ? 'border-b border-slate-100'
                              : ''
                          } ${p.code === phonePrefix ? 'bg-slate-50' : ''}`}
                        >
                          <Text className="text-[14px]">{p.flag}</Text>
                          <Text className="ml-2 flex-1 text-[13px] font-semibold text-[#0B1F44]">
                            {p.label}
                          </Text>
                          <Text className="text-[13px] font-medium text-slate-500">
                            {p.code}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>

                {/* Location with autocomplete */}
                <View>
                  <Text className="mb-1.5 text-[13px] font-bold text-slate-700">
                    {t('Mobile.profileEdit.location')}
                  </Text>
                  <LocationAutocomplete
                    value={profileLocation}
                    onChangeText={setProfileLocation}
                    onSelect={(s) => setProfileLocation(s.label)}
                    placeholder={t('Mobile.profileEdit.locationPh')}
                    variant="light"
                  />
                </View>

                <Field
                  label={t('Mobile.profileEdit.website')}
                  value={website}
                  onChangeText={setWebsite}
                  placeholder={t('Mobile.profileEdit.websitePh')}
                  keyboardType="url"
                  autoCapitalize="none"
                />

                <Pressable
                  onPress={onSave}
                  disabled={saving}
                  className="mt-2 flex-row items-center justify-center rounded-xl bg-[#F5C400] py-3.5 active:opacity-90 disabled:opacity-60"
                >
                  {saving ? (
                    <ActivityIndicator color="#162C66" size="small" />
                  ) : (
                    <Save color="#162C66" size={16} />
                  )}
                  <Text className="ml-2 text-[14px] font-extrabold text-[#162C66]">
                    {saving
                      ? t('Mobile.profileEdit.saving')
                      : t('Mobile.profileEdit.save')}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Profile Completion Card */}
            <View className="mx-4 mt-4 mb-2 overflow-hidden rounded-2xl bg-[#162C66] p-5">
              <View className="absolute left-0 right-0 top-0 h-1 bg-[#F5C400]" />
              <View className="flex-row items-center justify-between">
                <Text className="text-[15px] font-bold text-white">
                  {t('Mobile.profileEdit.profileStatus')}
                </Text>
                <Text className="text-2xl font-extrabold text-[#F5C400]">
                  {completion}%
                </Text>
              </View>
              <View className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <View
                  className="h-full rounded-full bg-[#F5C400]"
                  style={{ width: `${completion}%` }}
                />
              </View>

              <View className="mt-5" style={{ gap: 10 }}>
                <Check done={!!displayName} label={t('Mobile.profileEdit.checkName')} />
                <Check done={!!email} label={t('Mobile.profileEdit.checkEmail')} />
                <Check done={!!phone} label={t('Mobile.profileEdit.checkPhone')} />
                <Check
                  done={!!profileLocation}
                  label={t('Mobile.profileEdit.checkLocation')}
                />
                <Check done={!!image} label={t('Mobile.profileEdit.checkPhoto')} />
              </View>

              <Text className="mt-5 text-[12px] leading-relaxed text-white/40">
                {t('Mobile.profileEdit.profileHint')}
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'url';
  autoCapitalize?: 'none' | 'sentences';
}) {
  return (
    <View>
      <Text className="mb-1.5 text-[13px] font-bold text-slate-700">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] text-[#0B1F44]"
      />
    </View>
  );
}

function Check({ done, label }: { done: boolean; label: string }) {
  return (
    <View className="flex-row items-center">
      {done ? (
        <CheckCircle2 color="#F5C400" size={14} />
      ) : (
        <Circle color="rgba(255,255,255,0.3)" size={14} />
      )}
      <Text
        className="ml-2 text-[12px] font-medium"
        style={{
          color: done ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.6)',
          textDecorationLine: done ? 'line-through' : 'none',
        }}
      >
        {label}
      </Text>
    </View>
  );
}
