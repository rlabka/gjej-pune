import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Bookmark,
  Briefcase,
  ChevronRight,
  Crown,
  FileText,
  Eye,
  Globe,
  LogOut,
  Mail,
  Search as SearchIcon,
  Settings,
  Shield,
  User as UserIcon,
  UserCog,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useDialog } from '@/contexts/DialogContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { getDisplayName } from '@/lib/auth';
import { useState } from 'react';

const LOCALE_LABELS: Record<string, string> = {
  de: 'Deutsch',
  en: 'English',
  fr: 'Français',
  it: 'Italiano',
  sq: 'Shqip',
};

export default function ProfileScreen() {
  const { session, logout } = useAuth();
  const { t, locale, setLocale, locales } = useI18n();
  const dialog = useDialog();
  const router = useRouter();
  const [langOpen, setLangOpen] = useState(false);

  const isEmployer = session?.role === 'employer';

  async function onLogout() {
    const ok = await dialog.confirm({
      title: t('Mobile.profile.logout'),
      confirmLabel: t('Mobile.profile.logout'),
      cancelLabel: t('Mobile.common.cancel'),
      destructive: true,
    });
    if (ok) {
      await logout();
      router.replace('/welcome' as any);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-bg" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        <View className="px-6 pt-6">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-3xl font-extrabold text-secondary">
              {t('Mobile.profile.title')}
            </Text>
            <LanguageSwitcher variant="light" />
          </View>

          {session && (
            <View className="mt-6 rounded-2xl border border-border bg-white p-5">
              <View className="flex-row items-center">
                <View className="h-14 w-14 items-center justify-center rounded-full bg-primary">
                  <UserIcon color="#162C66" size={26} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-lg font-bold text-secondary" numberOfLines={1}>
                    {getDisplayName(session)}
                  </Text>
                  <Text className="text-sm text-muted" numberOfLines={1}>
                    {session.email}
                  </Text>
                </View>
              </View>
              {isEmployer && session.isPremium ? (
                <View className="mt-3 flex-row flex-wrap">
                  <View className="flex-row items-center rounded-full bg-accent px-3 py-1">
                    <Crown color="#FFFFFF" size={12} />
                    <Text className="ml-1 text-xs font-bold text-white">
                      {t('Mobile.profile.premiumActive')}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          )}

          {/* My content */}
          <View className="mt-5 overflow-hidden rounded-2xl border border-border bg-white">
            {isEmployer ? (
              <>
                <Row
                  icon={<Briefcase color="#162C66" size={18} />}
                  label={t('Mobile.profile.myJobs')}
                  onPress={() => router.push('/my-jobs' as any)}
                />
                <Divider />
                <Row
                  icon={<SearchIcon color="#162C66" size={18} />}
                  label={t('Mobile.menu.browseCandidates')}
                  onPress={() => router.push('/(tabs)/search' as any)}
                />
                <Divider />
              </>
            ) : (
              <>
                <Row
                  icon={<UserCog color="#162C66" size={18} />}
                  label={t('Mobile.menu.editProfile')}
                  onPress={() => router.push('/profile-edit' as any)}
                />
                <Divider />
              </>
            )}
            <Row
              icon={<Bookmark color="#162C66" size={18} />}
              label={t('Mobile.profile.favorites')}
              onPress={() => router.push('/favorites' as any)}
            />
          </View>

          {/* Premium (employer only — job-seekers have no paid tier) & Profile Views */}
          <View className="mt-5 overflow-hidden rounded-2xl border border-border bg-white">
            {isEmployer ? (
              <>
                <Row
                  icon={<Crown color="#F5C400" size={18} />}
                  label={t('Mobile.profile.premium')}
                  onPress={() => router.push('/premium' as any)}
                />
                <Divider />
              </>
            ) : null}
            <Row
              icon={<Eye color="#162C66" size={18} />}
              label={t('Mobile.profileViews.title')}
              onPress={() => router.push('/profile-views' as any)}
            />
          </View>

          {/* Settings */}
          <View className="mt-5 overflow-hidden rounded-2xl border border-border bg-white">
            <Row
              icon={<Settings color="#162C66" size={18} />}
              label={t('Mobile.profile.settings')}
              onPress={() => router.push('/settings' as any)}
            />
            <Divider />
            <Row
              icon={<Globe color="#162C66" size={18} />}
              label={`${t('Mobile.profile.language')}: ${LOCALE_LABELS[locale] ?? locale}`}
              onPress={() => setLangOpen((v) => !v)}
            />
            {langOpen && (
              <View className="border-t border-border">
                {locales.map((l) => (
                  <Pressable
                    key={l}
                    onPress={async () => {
                      await setLocale(l);
                      setLangOpen(false);
                    }}
                    className={`px-5 py-3 ${l === locale ? 'bg-primary/40' : ''}`}
                  >
                    <Text className="text-sm font-semibold text-foreground">
                      {LOCALE_LABELS[l] ?? l}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Help & Legal */}
          <View className="mt-5 overflow-hidden rounded-2xl border border-border bg-white">
            <Row
              icon={<Mail color="#162C66" size={18} />}
              label={t('Header.contact')}
              onPress={() => router.push('/contact' as any)}
            />
            <Divider />
            <Row
              icon={<FileText color="#64748B" size={18} />}
              label={t('Mobile.legal.agb')}
              onPress={() => router.push('/legal/agb' as any)}
            />
            <Divider />
            <Row
              icon={<Shield color="#64748B" size={18} />}
              label={t('Mobile.legal.privacy')}
              onPress={() => router.push('/legal/privacy' as any)}
            />
            <Divider />
            <Row
              icon={<FileText color="#64748B" size={18} />}
              label={t('Mobile.legal.imprint')}
              onPress={() => router.push('/legal/imprint' as any)}
            />
          </View>

          <Pressable
            onPress={onLogout}
            className="mt-6 flex-row items-center justify-center gap-2 rounded-xl border border-danger bg-white py-4 active:opacity-80"
          >
            <LogOut color="#DC2626" size={18} />
            <Text className="ml-2 text-base font-bold text-danger">
              {t('Mobile.profile.logout')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-5 py-4 active:bg-primary/20"
    >
      {icon}
      <Text className="ml-3 flex-1 text-sm font-semibold text-foreground">
        {label}
      </Text>
      <ChevronRight color="#9CA3AF" size={18} />
    </Pressable>
  );
}

function Divider() {
  return <View className="h-px bg-border" />;
}

function Badge({ label }: { label: string }) {
  return (
    <View className="self-start rounded-full bg-primary px-3 py-1">
      <Text className="text-xs font-bold text-secondary">{label}</Text>
    </View>
  );
}
