import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Crown,
  Eye,
  ExternalLink,
  Globe,
  Reply,
  Shield,
  Sparkles,
  XCircle,
  Zap,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useDialog } from '@/contexts/DialogContext';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';

/**
 * Premium screen — App Store-compliant (Apple Guideline 3.1.1).
 *
 * iOS apps may not display purchase pricing or in-app checkout for digital
 * subscriptions outside of StoreKit. We follow the LinkedIn / Patreon /
 * Reddit pattern: the app shows feature benefits but no prices and no plan
 * picker; a single CTA links to gjej-pune.com where the user picks a plan
 * and pays via Stripe (web). Existing subscribers see status + management
 * controls (cancel, reactivate, payment portal) — these are allowed because
 * they manage an existing subscription rather than create a new one.
 */

type SubscriptionDetails = {
  active: boolean;
  status: string;
  planMonths: number;
  amountCents: number;
  currency: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  paymentMethod: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  } | null;
};

const BENEFITS = [
  { icon: 'globe', key: 'benefitContact' },
  { icon: 'zap', key: 'benefitFirst' },
  { icon: 'reply', key: 'benefitMessages' },
  { icon: 'eye', key: 'benefitViews' },
] as const;

const BENEFIT_ICONS: Record<string, typeof Globe> = {
  globe: Globe,
  zap: Zap,
  reply: Reply,
  eye: Eye,
};

const WEB_PREMIUM_BASE = 'https://gjej-pune.com';

export default function PremiumScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const dialog = useDialog();
  const { session, refresh } = useAuth();

  const [sub, setSub] = useState<SubscriptionDetails | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const isPremium = session?.isPremium ?? false;
  const dashboardPath = session?.role === 'employer' ? 'employer' : 'job-seeker';

  const loadSubscription = useCallback(async () => {
    const token = (await getToken()) ?? undefined;
    if (!token) return;
    try {
      const subRes = await api.get<{ ok: boolean; subscription: SubscriptionDetails | null }>(
        '/api/stripe/subscription',
        token
      );
      if (subRes?.ok && subRes.subscription) {
        setSub(subRes.subscription);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  async function handleOpenWeb() {
    const url = `${WEB_PREMIUM_BASE}/${locale}/dashboard/${dashboardPath}/premium`;
    try {
      await Linking.openURL(url);
    } catch {
      dialog.showError(t('Mobile.common.error'));
    }
  }

  async function handleCancel() {
    const ok = await dialog.confirm({
      title: t('Mobile.premium.cancelSub'),
      message: t('Mobile.premium.cancelConfirm'),
      confirmLabel: t('Mobile.premium.cancelYes'),
      cancelLabel: t('Mobile.common.cancel'),
      destructive: true,
    });
    if (!ok) return;
    setCancelLoading(true);
    const token = (await getToken()) ?? undefined;
    try {
      const res = await api.post<{ ok: boolean; endDate?: string; error?: string }>(
        '/api/stripe/cancel',
        {},
        token
      );
      if (res?.ok && res.endDate) {
        dialog.showSuccess(
          t('Mobile.premium.canceledUntil') +
            ' ' +
            new Date(res.endDate).toLocaleDateString(locale)
        );
        loadSubscription();
        await refresh();
      } else {
        dialog.showError(res?.error ?? t('Mobile.common.error'));
      }
    } catch {
      dialog.showError(t('Mobile.common.error'));
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleReactivate() {
    setCancelLoading(true);
    const token = (await getToken()) ?? undefined;
    try {
      const res = await api.post<{ ok: boolean; error?: string }>(
        '/api/stripe/reactivate',
        {},
        token
      );
      if (res?.ok) {
        dialog.showSuccess(t('Mobile.common.done'));
        loadSubscription();
        await refresh();
      } else {
        dialog.showError(res?.error ?? t('Mobile.common.error'));
      }
    } catch {
      dialog.showError(t('Mobile.common.error'));
    } finally {
      setCancelLoading(false);
    }
  }

  async function handlePortal() {
    const token = (await getToken()) ?? undefined;
    if (!token) return;
    try {
      const res = await api.post<{ ok: boolean; url?: string }>(
        '/api/stripe/portal',
        { locale },
        token
      );
      if (res?.ok && res.url) {
        await Linking.openURL(res.url);
      }
    } catch {
      dialog.showError(t('Mobile.common.error'));
    }
  }

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* Hero header */}
      <View className="bg-[#162C66] pb-6 pt-2">
        <SafeAreaView edges={['top']}>
          <View className="flex-row items-center px-4 pt-2">
            <Pressable onPress={() => router.back()} className="p-2">
              <ArrowLeft color="#FFFFFF" size={22} />
            </Pressable>
            <View className="ml-2 flex-1">
              <View className="flex-row items-center">
                <Sparkles color="#F5C400" size={12} />
                <Text className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[#F5C400]">
                  PREMIUM
                </Text>
              </View>
              <Text className="text-xl font-extrabold text-white">
                {t('Mobile.premium.heading')}
              </Text>
            </View>
            <View className="h-12 w-12 items-center justify-center rounded-xl bg-[#F5C400]">
              <Crown color="#162C66" size={24} />
            </View>
          </View>
          <Text className="mt-1 px-6 text-[13px] text-white/50">
            {t('Mobile.premium.subheading')}
          </Text>
        </SafeAreaView>
      </View>

      <ScrollView
        className="flex-1 -mt-3"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 120, paddingHorizontal: 24 }}
      >
        {/* Benefits */}
        <View className="flex-row flex-wrap justify-between">
          {BENEFITS.map((b) => {
            const Icon = BENEFIT_ICONS[b.icon];
            return (
              <View
                key={b.key}
                className="mb-3 w-[48%] rounded-2xl border border-slate-200 bg-white p-4"
              >
                <View className="mb-2 h-9 w-9 items-center justify-center rounded-xl bg-[#F5C400]/15">
                  <Icon color="#F5C400" size={18} />
                </View>
                <Text className="text-[13px] font-bold leading-tight text-[#0B1F44]">
                  {t(`Mobile.premium.${b.key}`)}
                </Text>
              </View>
            );
          })}
        </View>

        {isPremium && sub?.active ? (
          // ── Active subscriber: status + management ──────────────
          <View className="mt-4">
            <View className="mb-4 flex-row items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 py-3">
              <CheckCircle color="#0B8A5A" size={18} />
              <Text className="ml-2 text-sm font-bold text-emerald-700">
                {t('Mobile.premium.alreadyPremium')}
              </Text>
            </View>

            <View className="rounded-2xl border border-slate-200 bg-white p-4">
              <DetailRow
                label={t('Mobile.premium.plan')}
                value={`Premium ${sub.planMonths} Mo.`}
              />
              <DetailRow
                label={t('Mobile.premium.memberSince')}
                value={new Date(sub.currentPeriodStart).toLocaleDateString(locale)}
              />
              <DetailRow
                label={t('Mobile.premium.nextPayment')}
                value={
                  sub.cancelAtPeriodEnd
                    ? '—'
                    : new Date(sub.currentPeriodEnd).toLocaleDateString(locale)
                }
              />
              {sub.paymentMethod && (
                <DetailRow
                  label={t('Mobile.premium.paymentMethod')}
                  value={`${sub.paymentMethod.brand.toUpperCase()} ****${sub.paymentMethod.last4}`}
                />
              )}
            </View>

            <Pressable
              onPress={handlePortal}
              className="mt-3 rounded-xl border border-slate-200 bg-white py-3 active:opacity-80"
            >
              <Text className="text-center text-[13px] font-bold text-[#162C66]">
                {t('Mobile.premium.manageSubscription')}
              </Text>
            </Pressable>

            {sub.cancelAtPeriodEnd ? (
              <View className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <Text className="text-sm font-semibold text-amber-800">
                  {t('Mobile.premium.canceledUntil')}{' '}
                  {new Date(sub.currentPeriodEnd).toLocaleDateString(locale)}
                </Text>
                <Pressable
                  onPress={handleReactivate}
                  disabled={cancelLoading}
                  className="mt-3 flex-row items-center justify-center rounded-xl border border-slate-200 bg-white py-2.5 active:opacity-80 disabled:opacity-50"
                >
                  {cancelLoading ? (
                    <ActivityIndicator color="#162C66" size="small" />
                  ) : (
                    <Text className="text-[13px] font-bold text-[#162C66]">
                      {t('Mobile.premium.reactivate')}
                    </Text>
                  )}
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={handleCancel}
                disabled={cancelLoading}
                className="mt-3 flex-row items-center justify-center rounded-xl border border-red-200 bg-red-50 py-3 active:opacity-80 disabled:opacity-50"
              >
                <XCircle color="#DC2626" size={15} />
                <Text className="ml-2 text-[13px] font-bold text-red-600">
                  {t('Mobile.premium.cancelSub')}
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          // ── Non-premium: web CTA only (no prices, no plan picker) ──
          <View className="mt-4">
            <Pressable
              onPress={handleOpenWeb}
              className="flex-row items-center justify-center rounded-2xl bg-[#F5C400] py-4 active:opacity-90"
              style={{
                shadowColor: '#F5C400',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <ExternalLink color="#162C66" size={18} />
              <Text className="ml-2 text-base font-extrabold text-[#162C66]">
                {t('Mobile.premium.activateOnWeb')}
              </Text>
            </Pressable>

            <Text className="mt-3 text-center text-[12px] text-slate-500">
              {t('Mobile.premium.activateOnWebHint')}
            </Text>
          </View>
        )}

        {/* Trust badge */}
        <View className="mt-6 items-center">
          <View className="flex-row items-center">
            <Shield color="#94A3B8" size={14} />
            <Text className="ml-1.5 text-[12px] font-semibold text-slate-400">
              {t('Mobile.premium.trusted')}
            </Text>
          </View>
          <Text className="mt-1 text-[11px] text-slate-400">
            {t('Mobile.premium.trustedDesc')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between border-b border-slate-50 py-2.5 last:border-b-0">
      <Text className="text-[12px] font-semibold text-slate-400">{label}</Text>
      <Text className="text-[13px] font-bold text-[#0B1F44]">{value}</Text>
    </View>
  );
}
