import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
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
  Check,
  CheckCircle,
  Crown,
  Eye,
  ExternalLink,
  Globe,
  Reply,
  RotateCcw,
  Shield,
  Sparkles,
  XCircle,
  Zap,
} from 'lucide-react-native';
import {
  useIAP,
  type ProductSubscription,
  type Purchase,
} from 'expo-iap';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useDialog } from '@/contexts/DialogContext';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';

/**
 * Premium screen — supports two purchase paths depending on platform:
 *
 *   iOS:     Apple In-App Purchase via StoreKit (required by App Store
 *            Review Guideline 3.1.1). Products are loaded from App Store
 *            Connect; the user buys with Face ID / passcode; we forward
 *            the receipt to our backend for verification.
 *
 *   Android: External web checkout (Stripe), same LinkedIn / Patreon
 *            pattern Google Play allows.
 *
 * Existing subscribers see status + management controls regardless of
 * platform — for iOS-IAP subs we deep-link to the system Subscriptions
 * pane, since Apple manages cancellation centrally.
 */

const PRODUCT_IDS = {
  '1month': 'com.gjp.app.premium.1month',
  '3months': 'com.gjp.app.premium.3months',
  '6months': 'com.gjp.app.premium.6months',
} as const;

const ORDERED_SKUS = [
  PRODUCT_IDS['1month'],
  PRODUCT_IDS['3months'],
  PRODUCT_IDS['6months'],
];

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

  const isIos = Platform.OS === 'ios';
  const isPremium = session?.isPremium ?? false;
  const dashboardPath = session?.role === 'employer' ? 'employer' : 'job-seeker';

  // ─── Backend subscription details (works for both Stripe + IAP subs) ──
  const [sub, setSub] = useState<SubscriptionDetails | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // ─── IAP state (iOS only) ──────────────────────────────────────────────
  const [purchaseInFlight, setPurchaseInFlight] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [productsLoaded, setProductsLoaded] = useState(false);

  // useIAP must be called on every render (Hook rules); on Android the
  // hook still works but we never actually trigger purchases there.
  const iap = useIAP({
    onPurchaseSuccess: async (purchase: Purchase) => {
      // Mobile got the receipt — verify it with our backend, which
      // round-trips to Apple's servers. Only after our backend confirms
      // do we mark the user as Premium and finish the StoreKit transaction.
      try {
        const token = (await getToken()) ?? undefined;
        const transactionId =
          (purchase as any).transactionId?.toString() ||
          (purchase as any).id?.toString();
        if (!token || !transactionId) {
          dialog.showError(t('Mobile.common.error'));
          setPurchaseInFlight(null);
          return;
        }
        const res = await api.post<{ ok: boolean; error?: string }>(
          '/api/iap/verify-purchase',
          { transactionId },
          token
        );
        if (res?.ok) {
          await iap.finishTransaction({ purchase });
          await refresh();
          loadSubscription();
          dialog.showSuccess(t('Mobile.premium.purchaseSuccess'));
        } else {
          dialog.showError(res?.error ?? t('Mobile.common.error'));
        }
      } catch {
        dialog.showError(t('Mobile.common.error'));
      } finally {
        setPurchaseInFlight(null);
      }
    },
    onPurchaseError: (error) => {
      console.warn('[IAP] purchase error:', error);
      // Cancel by the user — silently ignore. Any other error → toast.
      const code = (error as any)?.code;
      if (code !== 'E_USER_CANCELLED' && code !== 'USER_CANCELLED') {
        dialog.showError(
          (error as any)?.message || t('Mobile.premium.purchaseFailed')
        );
      }
      setPurchaseInFlight(null);
    },
    onError: (err) => {
      console.warn('[IAP] hook error:', err);
    },
  });

  // Fetch product info from App Store as soon as the IAP connection is ready.
  useEffect(() => {
    if (!isIos || !iap.connected || productsLoaded) return;
    (async () => {
      try {
        await iap.fetchProducts({ skus: ORDERED_SKUS, type: 'subs' });
        setProductsLoaded(true);
      } catch (err) {
        console.warn('[IAP] fetchProducts failed:', err);
      }
    })();
  }, [isIos, iap.connected, productsLoaded, iap]);

  const subscriptionsById = useMemo(() => {
    const map = new Map<string, ProductSubscription>();
    for (const s of iap.subscriptions) map.set((s as any).id || (s as any).productId, s);
    return map;
  }, [iap.subscriptions]);

  // ─── Backend sub fetch ────────────────────────────────────────────────
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

  // ─── Handlers ─────────────────────────────────────────────────────────

  async function handleIosPurchase(sku: string) {
    if (purchaseInFlight) return;
    setPurchaseInFlight(sku);
    try {
      await iap.requestPurchase({
        request: { ios: { sku } } as any,
        type: 'subs',
      });
      // The actual completion runs through the onPurchaseSuccess callback.
    } catch (err: any) {
      console.warn('[IAP] requestPurchase threw:', err);
      const code = err?.code;
      if (code !== 'E_USER_CANCELLED' && code !== 'USER_CANCELLED') {
        dialog.showError(err?.message || t('Mobile.premium.purchaseFailed'));
      }
      setPurchaseInFlight(null);
    }
  }

  async function handleRestore() {
    if (restoring) return;
    setRestoring(true);
    try {
      // 1) Ask the device to refresh its receipts from Apple's servers.
      await iap.restorePurchases();
      // 2) Forward the resulting transaction IDs to our backend so we can
      //    verify each and resync the user's subscription state.
      const txIds = (iap.availablePurchases || [])
        .map((p: any) => p?.transactionId?.toString())
        .filter(Boolean) as string[];
      const token = (await getToken()) ?? undefined;
      const res = await api.post<{ ok: boolean; isPremium?: boolean; restored?: number }>(
        '/api/iap/restore-purchases',
        { transactionIds: txIds },
        token
      );
      if (res?.ok) {
        await refresh();
        await loadSubscription();
        if (res.isPremium) {
          dialog.showSuccess(t('Mobile.premium.restoreSuccess'));
        } else {
          dialog.showError(t('Mobile.premium.restoreNothing'));
        }
      } else {
        dialog.showError(t('Mobile.common.error'));
      }
    } catch (err) {
      console.warn('[IAP] restore failed:', err);
      dialog.showError(t('Mobile.common.error'));
    } finally {
      setRestoring(false);
    }
  }

  async function handleOpenWeb() {
    const url = `${WEB_PREMIUM_BASE}/${locale}/dashboard/${dashboardPath}/premium`;
    try {
      await Linking.openURL(url);
    } catch {
      dialog.showError(t('Mobile.common.error'));
    }
  }

  async function handleManageIosSub() {
    try {
      // Apple's deep link to the system Subscriptions pane. expo-iap
      // exposes a helper, but this URL works on every iOS version.
      await Linking.openURL('https://apps.apple.com/account/subscriptions');
    } catch {
      dialog.showError(t('Mobile.common.error'));
    }
  }

  async function handleCancel() {
    // For iOS-IAP subs Apple owns the cancellation flow — deep-link
    // instead of calling our /stripe/cancel endpoint.
    if (isIos) {
      await handleManageIosSub();
      return;
    }
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
    if (isIos) {
      await handleManageIosSub();
      return;
    }
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
    if (isIos) {
      await handleManageIosSub();
      return;
    }
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

  // ─── Render ───────────────────────────────────────────────────────────

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
                {isIos
                  ? t('Mobile.premium.manageOnApple')
                  : t('Mobile.premium.manageSubscription')}
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
        ) : isIos ? (
          // ── iOS non-premium: Apple IAP plan cards ───────────────
          <View className="mt-4">
            {!iap.connected || !productsLoaded ? (
              <View className="items-center py-8">
                <ActivityIndicator color="#162C66" />
                <Text className="mt-3 text-[12px] font-semibold text-slate-500">
                  {t('Mobile.premium.loadingPlans')}
                </Text>
              </View>
            ) : (
              ORDERED_SKUS.map((sku) => {
                const product = subscriptionsById.get(sku);
                if (!product) return null;
                const isThisInFlight = purchaseInFlight === sku;
                const isAnyInFlight = !!purchaseInFlight;
                const months = sku.includes('6months') ? 6 : sku.includes('3months') ? 3 : 1;
                const isBest = months === 6;
                return (
                  <Pressable
                    key={sku}
                    onPress={() => handleIosPurchase(sku)}
                    disabled={isAnyInFlight}
                    className={`mb-3 rounded-2xl border bg-white p-4 active:opacity-80 disabled:opacity-50 ${
                      isBest ? 'border-[#F5C400]' : 'border-slate-200'
                    }`}
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        {isBest && (
                          <View className="mb-1 self-start rounded bg-[#F5C400]/15 px-2 py-0.5">
                            <Text className="text-[10px] font-extrabold uppercase tracking-wider text-[#B5860B]">
                              {t('Mobile.premium.bestOffer')}
                            </Text>
                          </View>
                        )}
                        <Text className="text-[15px] font-extrabold text-[#0B1F44]">
                          {(product as any).displayName || (product as any).title || `Premium ${months} Mo.`}
                        </Text>
                        <Text className="mt-0.5 text-[11px] text-slate-500" numberOfLines={2}>
                          {(product as any).description}
                        </Text>
                      </View>
                      <View className="ml-3 items-end">
                        <Text className="text-[17px] font-extrabold text-[#162C66]">
                          {(product as any).displayPrice}
                        </Text>
                        {months > 1 && (
                          <Text className="text-[10px] text-slate-400">
                            {t('Mobile.premium.totalPrice')}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View
                      className={`mt-3 flex-row items-center justify-center rounded-xl py-2.5 ${
                        isBest ? 'bg-[#F5C400]' : 'bg-[#162C66]'
                      }`}
                    >
                      {isThisInFlight ? (
                        <ActivityIndicator color={isBest ? '#162C66' : '#FFFFFF'} size="small" />
                      ) : (
                        <>
                          <Check color={isBest ? '#162C66' : '#FFFFFF'} size={14} />
                          <Text
                            className={`ml-2 text-[13px] font-extrabold ${
                              isBest ? 'text-[#162C66]' : 'text-white'
                            }`}
                          >
                            {t('Mobile.premium.subscribe')}
                          </Text>
                        </>
                      )}
                    </View>
                  </Pressable>
                );
              })
            )}

            {/* Restore Purchases — required by Apple Guideline 3.1.1 */}
            <Pressable
              onPress={handleRestore}
              disabled={restoring}
              className="mt-2 flex-row items-center justify-center rounded-xl border border-slate-200 bg-white py-3 active:opacity-80 disabled:opacity-50"
            >
              {restoring ? (
                <ActivityIndicator color="#162C66" size="small" />
              ) : (
                <>
                  <RotateCcw color="#162C66" size={14} />
                  <Text className="ml-2 text-[13px] font-bold text-[#162C66]">
                    {t('Mobile.premium.restorePurchases')}
                  </Text>
                </>
              )}
            </Pressable>

            {/* Auto-renewal disclosure — Apple-required wording */}
            <Text className="mt-4 text-[11px] leading-snug text-slate-500">
              {t('Mobile.premium.autoRenewDisclosure')}
            </Text>

            {/* Apple Guideline 3.1.2 — Privacy + Terms must be linked
                from any screen that offers an auto-renewable subscription. */}
            <View className="mt-3 flex-row flex-wrap items-center justify-center" style={{ gap: 14 }}>
              <Pressable
                onPress={() =>
                  Linking.openURL(`https://gjej-pune.com/${locale}/datenschutz`)
                }
              >
                <Text className="text-[11px] font-semibold text-[#162C66] underline">
                  {t('Mobile.premium.privacyPolicy')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  Linking.openURL(`https://gjej-pune.com/${locale}/agb`)
                }
              >
                <Text className="text-[11px] font-semibold text-[#162C66] underline">
                  {t('Mobile.premium.termsOfUse')}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          // ── Android non-premium: web-checkout CTA (LinkedIn pattern) ──
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
