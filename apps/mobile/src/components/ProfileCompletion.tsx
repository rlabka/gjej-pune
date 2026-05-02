import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import {
  CheckCircle2,
  Circle,
  UserCheck,
} from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';

type Locale = 'de' | 'en' | 'fr' | 'it' | 'sq';

const COPY: Record<Locale, {
  completeProfile: string;
  improveChances: string;
  progress: string;
  editProfile: string;
  checkName: string;
  checkEmail: string;
  checkPhone: string;
  checkLocation: string;
  checkPhoto: string;
}> = {
  de: {
    completeProfile: 'Profil vervollständigen',
    improveChances: 'Verbessere deine Einstellungschancen',
    progress: 'Fortschritt',
    editProfile: 'Profil bearbeiten',
    checkName: 'Name hinzufügen',
    checkEmail: 'E-Mail bestätigen',
    checkPhone: 'Telefonnummer',
    checkLocation: 'Standort angeben',
    checkPhoto: 'Profilbild hochladen',
  },
  en: {
    completeProfile: 'Complete your profile',
    improveChances: 'Improve your hiring chances',
    progress: 'Progress',
    editProfile: 'Edit Profile',
    checkName: 'Add name',
    checkEmail: 'Confirm email',
    checkPhone: 'Phone number',
    checkLocation: 'Add location',
    checkPhoto: 'Upload profile photo',
  },
  fr: {
    completeProfile: 'Complétez votre profil',
    improveChances: 'Améliorez vos chances',
    progress: 'Progrès',
    editProfile: 'Modifier le profil',
    checkName: 'Ajouter un nom',
    checkEmail: "Confirmer l'e-mail",
    checkPhone: 'Numéro de téléphone',
    checkLocation: 'Indiquer le lieu',
    checkPhoto: 'Télécharger une photo',
  },
  it: {
    completeProfile: 'Completa il tuo profilo',
    improveChances: 'Migliora le tue possibilità',
    progress: 'Progresso',
    editProfile: 'Modifica profilo',
    checkName: 'Aggiungi nome',
    checkEmail: 'Conferma e-mail',
    checkPhone: 'Numero di telefono',
    checkLocation: 'Indica la posizione',
    checkPhoto: 'Carica foto profilo',
  },
  sq: {
    completeProfile: 'Plotëso profilin tënd',
    improveChances: 'Përmirëso shanset e punësimit',
    progress: 'Progresi',
    editProfile: 'Ndrysho profilin',
    checkName: 'Shto emrin',
    checkEmail: 'Konfirmo email-in',
    checkPhone: 'Numri i telefonit',
    checkLocation: 'Shto vendndodhjen',
    checkPhoto: 'Ngarko foton e profilit',
  },
};

type ProfileData = {
  displayName: string | null;
  email: string;
  phone: string | null;
  location: string | null;
  image: string | null;
};

const RADIUS = 24;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ProfileCompletion() {
  const router = useRouter();
  const { locale } = useI18n();
  const l: Locale = (['de', 'en', 'fr', 'it', 'sq'] as const).includes(
    locale as Locale
  )
    ? (locale as Locale)
    : 'sq';
  const c = COPY[l];

  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<{ done: boolean; label: string }[]>([
    { done: false, label: c.checkName },
    { done: false, label: c.checkEmail },
    { done: false, label: c.checkPhone },
    { done: false, label: c.checkLocation },
    { done: false, label: c.checkPhoto },
  ]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = (await getToken()) ?? undefined;
      if (!token) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const res = await api.get<{ ok: boolean; profile: ProfileData }>(
          '/api/settings/profile',
          token
        );
        if (cancelled) return;
        if (res.ok && res.profile) {
          const p = res.profile;
          setSteps([
            { done: !!p.displayName, label: c.checkName },
            { done: !!p.email, label: c.checkEmail },
            { done: !!p.phone, label: c.checkPhone },
            { done: !!p.location, label: c.checkLocation },
            { done: !!p.image, label: c.checkPhoto },
          ]);
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [c.checkName, c.checkEmail, c.checkPhone, c.checkLocation, c.checkPhoto]);

  const doneCount = steps.filter((s) => s.done).length;
  const percentage = Math.round((doneCount / steps.length) * 100);
  // If profile is fully complete, hide the widget — there's nothing left to do.
  if (!loading && doneCount === steps.length) return null;

  return (
    <View
      className="mx-6 mb-4 rounded-2xl border border-slate-200/60 bg-white p-5"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      {/* Header */}
      <View className="mb-5 flex-row items-center" style={{ gap: 12 }}>
        <View className="h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
          <UserCheck color="#059669" size={20} strokeWidth={2} />
        </View>
        <View className="flex-1">
          <Text
            className="text-[15px] font-bold text-[#0B1F44]"
            style={{ lineHeight: 19 }}
          >
            {c.completeProfile}
          </Text>
          <Text className="mt-0.5 text-[12px] font-medium text-slate-400">
            {c.improveChances}
          </Text>
        </View>
      </View>

      {loading ? (
        <View className="items-center py-6">
          <ActivityIndicator color="#162C66" />
        </View>
      ) : (
        <>
          {/* Progress card with circular indicator */}
          <View
            className="mb-5 flex-row items-center rounded-xl bg-slate-50/80 p-3"
            style={{ gap: 16 }}
          >
            <View
              className="relative items-center justify-center"
              style={{ width: 56, height: 56 }}
            >
              <Svg width={56} height={56} style={{ transform: [{ rotate: '-90deg' }] }}>
                <SvgCircle
                  cx={28}
                  cy={28}
                  r={RADIUS}
                  stroke="#E2E8F0"
                  strokeWidth={4}
                  fill="none"
                />
                <SvgCircle
                  cx={28}
                  cy={28}
                  r={RADIUS}
                  stroke="#162C66"
                  strokeWidth={4}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${CIRCUMFERENCE}`}
                  strokeDashoffset={`${CIRCUMFERENCE * (1 - percentage / 100)}`}
                />
              </Svg>
              <Text
                className="absolute text-[12px] font-extrabold text-[#162C66]"
              >
                {percentage}%
              </Text>
            </View>
            <View>
              <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {c.progress}
              </Text>
              <Text className="mt-0.5 text-[15px] font-extrabold text-[#0B1F44]">
                {doneCount}/{steps.length}
              </Text>
            </View>
          </View>

          {/* Step checklist */}
          <View className="mb-5" style={{ gap: 10 }}>
            {steps.map((step, i) => (
              <View
                key={i}
                className="flex-row items-center"
                style={{ gap: 10 }}
              >
                {step.done ? (
                  <CheckCircle2 color="#10B981" size={16} />
                ) : (
                  <Circle color="#CBD5E1" size={16} />
                )}
                <Text
                  className={`text-[13px] font-medium ${
                    step.done ? 'text-slate-400 line-through' : 'text-[#0B1F44]'
                  }`}
                >
                  {step.label}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* CTA */}
      <Pressable
        onPress={() => router.push('/profile-edit' as any)}
        className="h-11 items-center justify-center rounded-xl bg-[#162C66] active:opacity-90"
        style={{
          shadowColor: '#162C66',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.18,
          shadowRadius: 10,
          elevation: 3,
        }}
      >
        <Text className="text-[13px] font-bold text-white">
          {c.editProfile}
        </Text>
      </Pressable>
    </View>
  );
}
