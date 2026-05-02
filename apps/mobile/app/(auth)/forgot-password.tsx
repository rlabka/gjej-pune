import { useState } from 'react';
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
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Mail,
  ShieldCheck,
} from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';
import { api } from '@/lib/api';

const LOGO_IMAGE = require('../../assets/images/logo.png');

type Locale = 'de' | 'en' | 'fr' | 'it' | 'sq';

const UI: Record<Locale, {
  back: string;
  hero: string;
  heroDesc: string;
  trust: string;
  title: string;
  subtitle: string;
  emailLabel: string;
  emailPh: string;
  submit: string;
  submitting: string;
  successTitle: string;
  successDesc: string;
  successCta: string;
  errorGeneric: string;
  rememberPw: string;
  goLogin: string;
}> = {
  de: {
    back: 'Zurück',
    hero: 'Passwort zurücksetzen',
    heroDesc: 'Wir helfen dir, schnell wieder Zugang zu deinem Konto zu bekommen.',
    trust: 'Sichere Wiederherstellung',
    title: 'Passwort vergessen?',
    subtitle:
      'Gib deine E-Mail-Adresse ein. Wir senden dir einen sicheren Link, um dein Passwort zurückzusetzen.',
    emailLabel: 'E-Mail-Adresse',
    emailPh: 'du@beispiel.com',
    submit: 'Link senden',
    submitting: 'Wird gesendet…',
    successTitle: 'E-Mail unterwegs',
    successDesc:
      'Falls ein Konto mit dieser E-Mail existiert, hast du in wenigen Minuten einen Reset-Link im Postfach. Schau auch im Spam-Ordner nach.',
    successCta: 'Zur Anmeldung',
    errorGeneric: 'Etwas ist schiefgelaufen. Bitte erneut versuchen.',
    rememberPw: 'Passwort wieder eingefallen?',
    goLogin: 'Anmelden',
  },
  en: {
    back: 'Back',
    hero: 'Reset password',
    heroDesc: 'We’ll help you regain access to your account quickly and securely.',
    trust: 'Secure recovery',
    title: 'Forgot your password?',
    subtitle:
      'Enter your email address. We’ll send you a secure link to reset your password.',
    emailLabel: 'Email address',
    emailPh: 'you@example.com',
    submit: 'Send reset link',
    submitting: 'Sending…',
    successTitle: 'Email on the way',
    successDesc:
      'If an account exists with this email, you’ll receive a reset link within a few minutes. Don’t forget to check your spam folder.',
    successCta: 'Back to login',
    errorGeneric: 'Something went wrong. Please try again.',
    rememberPw: 'Remember your password?',
    goLogin: 'Log in',
  },
  fr: {
    back: 'Retour',
    hero: 'Réinitialiser le mot de passe',
    heroDesc:
      'Nous vous aidons à retrouver rapidement et en toute sécurité l’accès à votre compte.',
    trust: 'Récupération sécurisée',
    title: 'Mot de passe oublié ?',
    subtitle:
      'Saisissez votre adresse e-mail. Nous vous enverrons un lien sécurisé pour réinitialiser votre mot de passe.',
    emailLabel: 'Adresse e-mail',
    emailPh: 'vous@exemple.fr',
    submit: 'Envoyer le lien',
    submitting: 'Envoi…',
    successTitle: 'E-mail en route',
    successDesc:
      'Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation dans quelques minutes. Pensez à vérifier vos spams.',
    successCta: 'Retour à la connexion',
    errorGeneric: 'Une erreur est survenue. Veuillez réessayer.',
    rememberPw: 'Vous vous souvenez de votre mot de passe ?',
    goLogin: 'Se connecter',
  },
  it: {
    back: 'Indietro',
    hero: 'Reimposta password',
    heroDesc:
      'Ti aiutiamo a riottenere l’accesso al tuo account in modo rapido e sicuro.',
    trust: 'Recupero sicuro',
    title: 'Password dimenticata?',
    subtitle:
      'Inserisci il tuo indirizzo e-mail. Ti invieremo un link sicuro per reimpostare la password.',
    emailLabel: 'Indirizzo e-mail',
    emailPh: 'tu@esempio.com',
    submit: 'Invia link',
    submitting: 'Invio…',
    successTitle: 'E-mail in arrivo',
    successDesc:
      'Se esiste un account con questa e-mail, riceverai un link di reset entro pochi minuti. Controlla anche la cartella spam.',
    successCta: 'Torna al login',
    errorGeneric: 'Qualcosa è andato storto. Riprovare.',
    rememberPw: 'Ti ricordi la password?',
    goLogin: 'Accedi',
  },
  sq: {
    back: 'Kthehu',
    hero: 'Rivendos fjalëkalimin',
    heroDesc:
      'Ne ju ndihmojmë të rifitoni qasjen në llogarinë tuaj shpejt dhe sigurt.',
    trust: 'Rikuperim i sigurt',
    title: 'Harruat fjalëkalimin?',
    subtitle:
      'Vendos adresën e emailit tënd. Do të të dërgojmë një link të sigurt për të rivendosur fjalëkalimin.',
    emailLabel: 'Adresa e emailit',
    emailPh: 'ti@shembull.com',
    submit: 'Dërgo linkun',
    submitting: 'Duke dërguar…',
    successTitle: 'Emaili u dërgua',
    successDesc:
      'Nëse ekziston një llogari me këtë email, do të marrësh një link rivendosjeje brenda pak minutash. Mos harro të kontrollosh dosjen e spamit.',
    successCta: 'Kthehu te hyrja',
    errorGeneric: 'Diçka shkoi keq. Provoni përsëri.',
    rememberPw: 'Të kujtohet fjalëkalimi?',
    goLogin: 'Hyr',
  },
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { locale } = useI18n();

  const l: Locale = (['de', 'en', 'fr', 'it', 'sq'] as const).includes(
    locale as Locale
  )
    ? (locale as Locale)
    : 'sq';
  const ui = UI[l];

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = isValidEmail && !submitting;

  async function onSubmit() {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await api.post('/api/auth/forgot-password', {
        email: email.trim().toLowerCase(),
      });
      setSent(true);
    } catch {
      setError(ui.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* Top bar */}
      <SafeAreaView edges={['top']} className="bg-white">
        <View
          className="flex-row items-center justify-between border-b border-slate-200/70 bg-white px-4 py-3"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 3,
            elevation: 1,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full active:bg-slate-50"
          >
            <ArrowLeft color="#64748B" size={20} />
          </Pressable>
          <Image
            source={LOGO_IMAGE}
            style={{ height: 28, width: 110 }}
            resizeMode="contain"
          />
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero strip */}
          <View className="overflow-hidden bg-[#0B1F44] px-6 py-6">
            <View className="mb-3 flex-row self-start rounded-full bg-[#F5C400]/15 px-3 py-1">
              <KeyRound color="#F5C400" size={11} />
              <Text className="ml-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#F5C400]">
                {ui.hero}
              </Text>
            </View>
            <Text className="text-[20px] font-extrabold leading-tight tracking-tight text-white">
              {ui.title}
            </Text>
            <Text className="mt-2 text-[13px] font-medium leading-relaxed text-blue-100/60">
              {ui.heroDesc}
            </Text>
            <View className="mt-4 flex-row items-center" style={{ gap: 6 }}>
              <ShieldCheck color="#34D399" size={13} />
              <Text className="text-[11px] font-medium text-white/50">
                {ui.trust}
              </Text>
            </View>
          </View>

          {/* Form / Success card */}
          <View
            className="mx-4 mt-6 overflow-hidden rounded-2xl border border-slate-200/60 bg-white"
            style={{
              shadowColor: '#0B1F44',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.06,
              shadowRadius: 20,
              elevation: 3,
            }}
          >
            {sent ? (
              <View className="items-center px-6 py-10">
                {/* Animated check ring */}
                <View
                  className="h-20 w-20 items-center justify-center rounded-full bg-emerald-50"
                  style={{
                    borderWidth: 6,
                    borderColor: '#A7F3D0',
                  }}
                >
                  <CheckCircle2 color="#10B981" size={36} strokeWidth={2.2} />
                </View>
                <Text className="mt-5 text-center text-[20px] font-extrabold tracking-tight text-[#0B1F44]">
                  {ui.successTitle}
                </Text>
                <Text className="mt-2 max-w-[300px] text-center text-[13px] font-medium leading-relaxed text-slate-500">
                  {ui.successDesc}
                </Text>
                <Pressable
                  onPress={() => router.replace('/(auth)/login' as any)}
                  className="mt-6 h-[52px] w-full flex-row items-center justify-center rounded-xl bg-[#162C66] active:opacity-90"
                  style={{
                    shadowColor: '#162C66',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.25,
                    shadowRadius: 12,
                    elevation: 4,
                  }}
                >
                  <Text className="mr-2 text-[15px] font-extrabold text-white">
                    {ui.successCta}
                  </Text>
                  <ArrowRight color="#FFFFFF" size={16} strokeWidth={2.5} />
                </Pressable>
              </View>
            ) : (
              <View className="px-5 py-7">
                {/* Icon header */}
                <View className="mb-5 flex-row items-center" style={{ gap: 12 }}>
                  <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#162C66]/[0.06]">
                    <KeyRound color="#162C66" size={22} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[18px] font-extrabold tracking-tight text-[#0B1F44]">
                      {ui.title}
                    </Text>
                  </View>
                </View>

                <Text className="mb-6 text-[13px] font-medium leading-relaxed text-[#6B7A90]">
                  {ui.subtitle}
                </Text>

                {error ? (
                  <View className="mb-5 overflow-hidden rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <View className="flex-row items-start" style={{ gap: 10 }}>
                      <View className="mt-0.5 h-7 w-7 items-center justify-center rounded-lg bg-red-500">
                        <Text className="text-[12px] font-extrabold text-white">!</Text>
                      </View>
                      <Text className="flex-1 text-[12px] font-semibold leading-snug text-red-700">
                        {error}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {/* Email field — same enterprise styling as login */}
                <View className="mb-2">
                  <Text className="mb-2 text-[12px] font-extrabold uppercase tracking-wider text-slate-500">
                    {ui.emailLabel} <Text className="text-red-500">*</Text>
                  </Text>
                  <View
                    className="h-[56px] flex-row items-center rounded-xl border border-slate-200 bg-slate-50/80"
                    style={{ paddingHorizontal: 14 }}
                  >
                    <View className="h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-white">
                      <Mail color="#64748B" size={16} />
                    </View>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder={ui.emailPh}
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                      autoComplete="email"
                      keyboardType="email-address"
                      className="ml-3 flex-1 text-[15px] font-medium text-[#0B1F44]"
                      style={{ height: '100%' }}
                    />
                  </View>
                </View>

                {/* Submit */}
                <Pressable
                  onPress={onSubmit}
                  disabled={!canSubmit}
                  className={`mt-5 h-[52px] flex-row items-center justify-center rounded-xl active:opacity-90 ${
                    canSubmit ? 'bg-[#162C66]' : 'bg-slate-100'
                  }`}
                  style={
                    canSubmit
                      ? {
                          shadowColor: '#162C66',
                          shadowOffset: { width: 0, height: 6 },
                          shadowOpacity: 0.25,
                          shadowRadius: 12,
                          elevation: 4,
                        }
                      : undefined
                  }
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text
                        className={`mr-2 text-[15px] font-extrabold ${
                          canSubmit ? 'text-white' : 'text-slate-400'
                        }`}
                      >
                        {ui.submit}
                      </Text>
                      <ArrowRight
                        color={canSubmit ? '#FFFFFF' : '#94A3B8'}
                        size={16}
                        strokeWidth={2.5}
                      />
                    </>
                  )}
                </Pressable>

                {/* Back-to-login footer */}
                <View
                  className="mt-6 flex-row items-center justify-center"
                  style={{ gap: 6 }}
                >
                  <Text className="text-[13px] font-medium text-slate-500">
                    {ui.rememberPw}
                  </Text>
                  <Pressable
                    onPress={() => router.replace('/(auth)/login' as any)}
                    className="active:opacity-70"
                  >
                    <Text className="text-[13px] font-extrabold text-[#162C66]">
                      {ui.goLogin}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
