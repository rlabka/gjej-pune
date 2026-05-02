import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, usePathname, useRouter } from 'expo-router';
import {
  ArrowRight,
  Briefcase,
  Check,
  FileEdit,
  LogOut,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';

const LOGO_IMAGE = require('../../assets/images/logo.png');

type Locale = 'de' | 'en' | 'fr' | 'it' | 'sq';

const COPY: Record<Locale, {
  badge: string;
  titleJobSeeker: string;
  titleEmployer: string;
  descJobSeeker: string;
  descEmployer: string;
  ctaJobSeeker: string;
  ctaEmployer: string;
  steps: string[];
  logout: string;
}> = {
  de: {
    badge: 'Noch ein Schritt',
    titleJobSeeker: 'Erstellen Sie Ihr Jobprofil',
    titleEmployer: 'Erstellen Sie Ihre erste Stellenanzeige',
    descJobSeeker:
      'Damit Arbeitgeber Sie finden können, brauchen Sie ein Jobprofil. Erstellen Sie es jetzt — es dauert nur wenige Minuten.',
    descEmployer:
      'Damit Kandidaten Sie finden können, brauchen Sie eine Stellenanzeige. Erstellen Sie jetzt Ihr erstes Inserat — es dauert nur wenige Minuten.',
    ctaJobSeeker: 'Jobprofil erstellen',
    ctaEmployer: 'Stellenanzeige erstellen',
    steps: ['Konto erstellt', 'Anzeige erstellen', 'Dashboard nutzen'],
    logout: 'Abmelden',
  },
  en: {
    badge: 'One more step',
    titleJobSeeker: 'Create your job profile',
    titleEmployer: 'Create your first job listing',
    descJobSeeker:
      'So employers can find you, you need a job profile. Create your job profile now — it only takes a few minutes.',
    descEmployer:
      'So candidates can find you, you need a job listing. Create your first posting now — it only takes a few minutes.',
    ctaJobSeeker: 'Create Job Profile',
    ctaEmployer: 'Create Job Listing',
    steps: ['Account created', 'Create listing', 'Use dashboard'],
    logout: 'Logout',
  },
  fr: {
    badge: 'Encore une étape',
    titleJobSeeker: 'Créez votre profil emploi',
    titleEmployer: "Créez votre première offre d'emploi",
    descJobSeeker:
      'Pour que les employeurs vous trouvent, créez votre profil emploi. Cela ne prend que quelques minutes.',
    descEmployer:
      'Pour que les candidats vous trouvent, créez votre première offre. Cela ne prend que quelques minutes.',
    ctaJobSeeker: 'Créer un profil emploi',
    ctaEmployer: "Créer une offre d'emploi",
    steps: ['Compte créé', "Créer l'annonce", 'Utiliser le dashboard'],
    logout: 'Déconnexion',
  },
  it: {
    badge: 'Ancora un passo',
    titleJobSeeker: 'Crea il tuo profilo lavoro',
    titleEmployer: 'Crea il tuo primo annuncio',
    descJobSeeker:
      'Per farti trovare dai datori di lavoro, crea il tuo profilo lavoro. Ci vogliono solo pochi minuti.',
    descEmployer:
      'Per farti trovare dai candidati, crea il tuo primo annuncio. Ci vogliono solo pochi minuti.',
    ctaJobSeeker: 'Crea profilo lavoro',
    ctaEmployer: 'Crea annuncio di lavoro',
    steps: ['Account creato', "Crea l'annuncio", 'Usa la dashboard'],
    logout: 'Esci',
  },
  sq: {
    badge: 'Edhe një hap',
    titleJobSeeker: 'Krijoni profilin tuaj të punës',
    titleEmployer: 'Krijoni shpalljen tuaj të parë',
    descJobSeeker:
      "Që punëdhënësit t'ju gjejnë, krijoni profilin tuaj të punës. Duhen vetëm disa minuta.",
    descEmployer:
      "Që kandidatët t'ju gjejnë, krijoni shpalljen tuaj të parë. Duhen vetëm disa minuta.",
    ctaJobSeeker: 'Krijo profil pune',
    ctaEmployer: 'Krijo shpallje pune',
    steps: ['Llogaria u krijua', 'Krijo shpalljen', 'Përdor dashboard-in'],
    logout: 'Dil',
  },
};

/**
 * Mirrors the web's DashboardGuard onboarding gate.
 * Blocks all logged-in users from using the app until they have created
 * at least one listing (job for employers, ad for job-seekers).
 *
 * Pages explicitly allowed during onboarding (creation/setup pages):
 *   - /ad/new, /ad/edit/*    (job-seekers)
 *   - /job/new, /job/edit/*  (employers)
 *   - /my-ads, /my-jobs       (so the create button there works)
 *   - /settings, /profile-edit
 *   - /legal/*                (privacy/terms)
 *   - /contact
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { session, logout } = useAuth();
  const { locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  const l: Locale = (['de', 'en', 'fr', 'it', 'sq'] as const).includes(
    locale as Locale
  )
    ? (locale as Locale)
    : 'sq';
  const copy = COPY[l];

  const isEmployer = session?.role === 'employer';
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);

  const checkOnboarding = useCallback(async () => {
    if (!session) return;
    try {
      const token = (await getToken()) ?? undefined;
      if (!token) return;
      const endpoint = isEmployer ? '/api/jobs/mine' : '/api/ads/mine';
      type Res = { ok: boolean; jobs?: unknown[]; ads?: unknown[] };
      const res = await api.get<Res>(endpoint, token);
      const items = isEmployer ? res.jobs : res.ads;
      const hasItems = !!(res?.ok && items && items.length > 0);
      setNeedsOnboarding(!hasItems);
    } catch {
      // On error, fail open — let user through (avoids blocking on flaky network)
      setNeedsOnboarding(false);
    }
  }, [session, isEmployer]);

  // Re-check whenever the screen regains focus (so creating a listing dismisses the guard)
  useFocusEffect(
    useCallback(() => {
      checkOnboarding();
    }, [checkOnboarding])
  );

  useEffect(() => {
    checkOnboarding();
  }, [checkOnboarding]);

  // Re-check on every navigation. Without this, navigating from /ad/new (after
  // a successful create) to a non-tab route like /ad/[id] keeps the stale
  // needsOnboarding=true state and shows the overlay over the new screen.
  useEffect(() => {
    checkOnboarding();
  }, [pathname, checkOnboarding]);

  // No session, admin, or still checking → render children normally (no overlay)
  // CRITICAL: never unmount children, otherwise router.replace() to nested
  // routes like /(tabs) fails because the navigator hasn't registered them yet.
  if (!session || session.role === 'admin' || needsOnboarding === null) {
    return <>{children}</>;
  }

  // Pages allowed even during onboarding — let them render normally
  const allowedPathPrefixes = [
    // Auth flow & landing
    '/welcome',
    '/login',
    '/register',
    '/forgot-password',
    // Ad/Job creation paths
    '/ad/new',
    '/ad/edit',
    '/job/new',
    '/job/edit',
    '/my-ads',
    '/my-jobs',
    // Settings & profile
    '/settings',
    '/profile-edit',
    // Static / public-style screens
    '/legal',
    '/contact',
  ];
  const isAllowed = allowedPathPrefixes.some((p) => pathname.startsWith(p));

  if (!needsOnboarding || isAllowed) {
    return <>{children}</>;
  }

  // Show onboarding overlay — rendered ON TOP of children so the navigator
  // tree stays intact while the user is forced into the onboarding flow.
  const Icon = isEmployer ? Briefcase : FileEdit;
  const ctaTarget = isEmployer ? '/job/new' : '/ad/new';
  const title = isEmployer ? copy.titleEmployer : copy.titleJobSeeker;
  const desc = isEmployer ? copy.descEmployer : copy.descJobSeeker;
  const cta = isEmployer ? copy.ctaEmployer : copy.ctaJobSeeker;

  return (
    <View style={{ flex: 1 }}>
      {/* Children stay mounted underneath so the navigator tree is preserved */}
      {children}

      {/* Full-screen onboarding overlay */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#F8FAFC',
        }}
      >
      <SafeAreaView edges={['top']} className="bg-white">
        {/* Compact header */}
        <View className="flex-row items-center justify-between border-b border-slate-200/60 bg-white px-4 py-3">
          <Image
            source={LOGO_IMAGE}
            style={{ width: 110, height: 28 }}
            resizeMode="contain"
          />
          <Pressable
            onPress={async () => {
              await logout();
              router.replace('/welcome' as any);
            }}
            className="flex-row items-center rounded-xl px-3 py-2 active:bg-red-50"
          >
            <LogOut color="#EF4444" size={14} />
            <Text className="ml-1.5 text-[12px] font-bold text-red-600">
              {copy.logout}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Centered onboarding card */}
      <View className="flex-1 items-center justify-center px-5">
        <View
          className="w-full max-w-[440px] overflow-hidden rounded-3xl border border-slate-200/60 bg-white"
          style={{
            shadowColor: '#0B1F44',
            shadowOffset: { width: 0, height: 16 },
            shadowOpacity: 0.1,
            shadowRadius: 30,
            elevation: 8,
          }}
        >
          {/* Gradient header */}
          <View className="overflow-hidden bg-[#162C66] px-7 py-7">
            {/* Decorative glow */}
            <View
              className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#F5C400]/10"
              style={{ transform: [{ translateX: 50 }, { translateY: -50 }] }}
            />
            <View
              className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-white/[0.03]"
              style={{ transform: [{ translateX: -30 }, { translateY: 30 }] }}
            />

            {/* Badge */}
            <View className="mb-4 flex-row self-start rounded-full bg-[#F5C400]/20 px-3 py-1">
              <View className="h-1.5 w-1.5 self-center rounded-full bg-[#F5C400]" />
              <Text className="ml-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#F5C400]">
                {copy.badge}
              </Text>
            </View>

            <Text className="text-[22px] font-extrabold leading-tight tracking-tight text-white">
              {title}
            </Text>
            <Text className="mt-2 text-[13px] font-medium leading-relaxed text-white/60">
              {desc}
            </Text>
          </View>

          {/* Step progress */}
          <View className="border-b border-slate-100 px-6 py-6">
            <View className="flex-row items-start justify-between">
              {copy.steps.map((step, i) => {
                const done = i === 0;
                const active = i === 1;
                return (
                  <View
                    key={i}
                    className="flex-1 items-center"
                    style={{ position: 'relative' }}
                  >
                    {/* Connector line */}
                    {i < copy.steps.length - 1 ? (
                      <View
                        className={`absolute h-[2px] ${
                          i === 0 ? 'bg-emerald-300' : 'bg-slate-200'
                        }`}
                        style={{
                          top: 14,
                          left: '60%',
                          right: '-40%',
                          zIndex: 0,
                        }}
                      />
                    ) : null}

                    <View
                      className={`h-7 w-7 items-center justify-center rounded-full ${
                        done
                          ? 'bg-emerald-100'
                          : active
                            ? 'bg-[#162C66]'
                            : 'bg-slate-100'
                      }`}
                      style={{
                        zIndex: 1,
                        ...(done
                          ? {
                              shadowColor: '#86EFAC',
                              shadowOffset: { width: 0, height: 0 },
                              shadowOpacity: 1,
                              shadowRadius: 0,
                              elevation: 0,
                            }
                          : active
                            ? {
                                shadowColor: '#162C66',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 4,
                              }
                            : {}),
                        borderWidth: 4,
                        borderColor: '#FFFFFF',
                      }}
                    >
                      {done ? (
                        <Check color="#10B981" size={13} strokeWidth={3} />
                      ) : (
                        <Text
                          className={`text-[11px] font-extrabold ${
                            active ? 'text-white' : 'text-slate-400'
                          }`}
                        >
                          {i + 1}
                        </Text>
                      )}
                    </View>
                    <Text
                      className={`mt-2 text-center text-[10px] font-bold leading-tight ${
                        done
                          ? 'text-emerald-600'
                          : active
                            ? 'text-[#162C66]'
                            : 'text-slate-400'
                      }`}
                    >
                      {step}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* CTA */}
          <View className="px-6 py-7">
            <Pressable
              onPress={() => router.push(ctaTarget as any)}
              className="h-[52px] flex-row items-center justify-center rounded-xl bg-[#162C66] active:opacity-90"
              style={{
                shadowColor: '#162C66',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 14,
                elevation: 4,
              }}
            >
              <Icon color="#FFFFFF" size={18} />
              <Text className="mx-2 text-[14px] font-extrabold text-white">
                {cta}
              </Text>
              <ArrowRight color="#FFFFFF" size={16} strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>
      </View>
      </View>
    </View>
  );
}
