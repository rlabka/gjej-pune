import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  Globe,
  Reply,
  Shield,
  Sparkles,
  XCircle,
  Zap,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';

type PlanItem = {
  id: string;
  label: string;
  intervalType: 'day' | 'week' | 'month';
  intervalCount: number;
  amountCents: number;
  oldPriceCents: number | null;
  currency: string;
  isBestOffer: boolean;
};

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

const DURATION_LABELS: Record<string, Record<string, [string, string]>> = {
  month: {
    de: ['Monat', 'Monate'],
    en: ['month', 'months'],
    fr: ['mois', 'mois'],
    it: ['mese', 'mesi'],
    sq: ['muaj', 'muaj'],
  },
  week: {
    de: ['Woche', 'Wochen'],
    en: ['week', 'weeks'],
    fr: ['semaine', 'semaines'],
    it: ['settimana', 'settimane'],
    sq: ['javë', 'javë'],
  },
  day: {
    de: ['Tag', 'Tage'],
    en: ['day', 'days'],
    fr: ['jour', 'jours'],
    it: ['giorno', 'giorni'],
    sq: ['ditë', 'ditë'],
  },
};

function formatDuration(count: number, type: string, locale: string): string {
  const labels = DURATION_LABELS[type]?.[locale] ?? DURATION_LABELS[type]?.de ?? ['', ''];
  return `${count} ${count === 1 ? labels[0] : labels[1]}`;
}

function formatPrice(amountCents: number, currency: string = 'eur'): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
}

export default function PremiumScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { locale } = useI18n();
  const { session, refresh } = useAuth();

  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [sub, setSub] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const isPremium = session?.isPremium ?? false;

  const loadData = useCallback(async () => {
    try {
      // Fetch plans (public endpoint)
      const plansRes = await api.get<{ ok: boolean; plans: PlanItem[] }>(
        `/api/stripe/plans?role=${session?.role === 'employer' ? 'employer' : 'job_seeker'}`
      );
      if (plansRes?.ok && plansRes.plans) {
        setPlans(plansRes.plans);
        const bestIdx = plansRes.plans.findIndex((p) => p.isBestOffer);
        if (bestIdx >= 0) setSelectedIndex(bestIdx);
        else if (plansRes.plans.length > 1) setSelectedIndex(1);
      }
    } catch {
      /* ignore */
    } finally {
      setPlansLoading(false);
    }

    // Fetch subscription details
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
  }, [session?.role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedPlan = plans[selectedIndex] as PlanItem | undefined;

  async function handleCheckout() {
    if (!selectedPlan) return;
    setLoading(true);
    const token = (await getToken()) ?? undefined;
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.post<{ ok: boolean; url?: string; error?: string }>(
        '/api/stripe/checkout',
        { planId: selectedPlan.id, locale },
        token
      );
      if (res?.ok && res.url) {
        await Linking.openURL(res.url);
      } else {
        Alert.alert(res?.error ?? t('Mobile.common.error'));
      }
    } catch {
      Alert.alert(t('Mobile.common.error'));
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    Alert.alert(
      t('Mobile.premium.cancelSub'),
      t('Mobile.premium.cancelConfirm'),
      [
        { text: t('Mobile.common.cancel'), style: 'cancel' },
        {
          text: t('Mobile.premium.cancelYes'),
          style: 'destructive',
          onPress: async () => {
            setCancelLoading(true);
            const token = (await getToken()) ?? undefined;
            try {
              const res = await api.post<{ ok: boolean; endDate?: string; error?: string }>(
                '/api/stripe/cancel',
                {},
                token
              );
              if (res?.ok && res.endDate) {
                Alert.alert(
                  t('Mobile.premium.canceledUntil') +
                    ' ' +
                    new Date(res.endDate).toLocaleDateString(locale)
                );
                loadData();
                await refresh();
              } else {
                Alert.alert(res?.error ?? t('Mobile.common.error'));
              }
            } catch {
              Alert.alert(t('Mobile.common.error'));
            } finally {
              setCancelLoading(false);
            }
          },
        },
      ]
    );
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
        Alert.alert(t('Mobile.common.done'));
        loadData();
        await refresh();
      } else {
        Alert.alert(res?.error ?? t('Mobile.common.error'));
      }
    } catch {
      Alert.alert(t('Mobile.common.error'));
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
      Alert.alert(t('Mobile.common.error'));
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

        {/* Active subscription info */}
        {isPremium && sub?.active ? (
          <View className="mt-4">
            {/* Status badge */}
            <View className="mb-4 flex-row items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 py-3">
              <CheckCircle color="#0B8A5A" size={18} />
              <Text className="ml-2 text-sm font-bold text-emerald-700">
                {t('Mobile.premium.alreadyPremium')}
              </Text>
            </View>

            {/* Sub details */}
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
                    : `${formatPrice(sub.amountCents, sub.currency)} · ${new Date(sub.currentPeriodEnd).toLocaleDateString(locale)}`
                }
              />
              {sub.paymentMethod && (
                <DetailRow
                  label={t('Mobile.premium.paymentMethod')}
                  value={`${sub.paymentMethod.brand.toUpperCase()} ****${sub.paymentMethod.last4}`}
                />
              )}
            </View>

            {/* Manage / Cancel / Reactivate */}
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
          <>
            {/* Plan cards */}
            <Text className="mb-2 mt-4 text-[13px] font-extrabold uppercase tracking-wider text-slate-400">
              {t('Mobile.premium.choosePlan')}
            </Text>

            {plansLoading ? (
              <View className="items-center py-8">
                <ActivityIndicator color="#162C66" />
                <Text className="mt-2 text-sm text-slate-400">
                  {t('Mobile.premium.loadingPlans')}
                </Text>
              </View>
            ) : plans.length === 0 ? (
              <Text className="py-8 text-center text-sm text-slate-400">
                {t('Mobile.premium.noPlans')}
              </Text>
            ) : (
              <View>
                {plans.map((plan, i) => {
                  const isSelected = selectedIndex === i;
                  const price = plan.amountCents / 100;
                  const oldPrice = plan.oldPriceCents ? plan.oldPriceCents / 100 : null;
                  const perMonth =
                    plan.intervalCount > 1
                      ? Math.round((price / plan.intervalCount) * 100) / 100
                      : null;

                  return (
                    <Pressable
                      key={plan.id}
                      onPress={() => setSelectedIndex(i)}
                      className={`mb-3 rounded-2xl border-2 p-5 ${
                        isSelected
                          ? 'border-[#F5C400] bg-[#F5C400]/5'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      {plan.isBestOffer && (
                        <View className="mb-2 self-start flex-row items-center rounded-full bg-[#F5C400] px-3 py-1">
                          <Sparkles color="#162C66" size={10} />
                          <Text className="ml-1 text-[10px] font-extrabold uppercase text-[#162C66]">
                            {t('Mobile.premium.bestOffer')}
                          </Text>
                        </View>
                      )}
                      <Text className="text-[14px] font-bold text-[#0B1F44]">
                        {formatDuration(plan.intervalCount, plan.intervalType, locale)}
                      </Text>
                      <View className="mt-1 flex-row items-baseline">
                        <Text className="text-3xl font-extrabold text-emerald-600">
                          {price}
                        </Text>
                        <Text className="ml-1 text-base font-bold text-emerald-600">€</Text>
                        {oldPrice && (
                          <Text className="ml-2 text-[13px] text-slate-400 line-through">
                            {oldPrice} €
                          </Text>
                        )}
                      </View>
                      {perMonth && (
                        <Text className="mt-0.5 text-[12px] text-slate-400">
                          {perMonth} € {t('Mobile.premium.monthly')}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* CTA */}
            {selectedPlan && (
              <Pressable
                onPress={handleCheckout}
                disabled={loading}
                className="mt-2 flex-row items-center justify-center rounded-2xl bg-[#F5C400] py-4 active:opacity-90 disabled:opacity-50"
                style={{
                  shadowColor: '#F5C400',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#162C66" />
                ) : (
                  <>
                    <Crown color="#162C66" size={20} />
                    <Text className="ml-2 text-base font-extrabold text-[#162C66]">
                      {t('Mobile.premium.goPremium')} –{' '}
                      {formatPrice(selectedPlan.amountCents, selectedPlan.currency)}
                    </Text>
                  </>
                )}
              </Pressable>
            )}
          </>
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
