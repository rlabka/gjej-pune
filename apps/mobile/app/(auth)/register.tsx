import { useEffect, useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import {
  ArrowLeft,
  Briefcase,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react-native';

const LOGO_IMAGE = require('../../assets/images/logo.png');
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useDialog } from '@/contexts/DialogContext';
import {
  exchangeGoogleTokenForFirebase,
  isGoogleAuthConfigured,
  signInWithGoogle,
} from '@/lib/firebase';
import * as AppleAuthentication from 'expo-apple-authentication';
import { loginWithApple, loginWithGoogle, type AuthRole } from '@/lib/auth';

type Locale = 'de' | 'en' | 'fr' | 'it' | 'sq';

const MARKETING: Record<
  Locale,
  { title: string; subtitle: string; trust: string; region: string }
> = {
  de: {
    title: 'Erstelle dein Konto',
    subtitle:
      'In wenigen Sekunden registrieren — und Jobs in ganz Europa finden oder Talente für dein Team gewinnen.',
    trust: 'Sicher & vertrauenswürdig',
    region: 'Jobs in Europa',
  },
  en: {
    title: 'Create your account',
    subtitle:
      'Sign up in seconds — find jobs across Europe or attract talent to your team.',
    trust: 'Secure & trustworthy',
    region: 'Jobs in Europe',
  },
  fr: {
    title: 'Créez votre compte',
    subtitle:
      'Inscrivez-vous en quelques secondes — trouvez un emploi en Europe ou attirez des talents.',
    trust: 'Sûr & fiable',
    region: 'Emplois en Europe',
  },
  it: {
    title: 'Crea il tuo account',
    subtitle:
      'Registrati in pochi secondi — trova lavoro in Europa o attrai nuovi talenti.',
    trust: 'Sicuro & affidabile',
    region: 'Lavoro in Europa',
  },
  sq: {
    title: 'Krijo llogarinë tënde',
    subtitle:
      'Regjistrohu në pak sekonda — gjej punë në Evropë ose tërheq talente për ekipin tënd.',
    trust: 'E sigurt & e besueshme',
    region: 'Punë në Evropë',
  },
};

const UI: Record<
  Locale,
  {
    heading: string;
    loginTab: string;
    registerTab: string;
    registerSubtitle: string;
    rolePrompt: string;
    jobSeekerTitle: string;
    jobSeekerDesc: string;
    employerTitle: string;
    employerDesc: string;
    emailLabel: string;
    emailPh: string;
    passwordLabel: string;
    passwordPh: string;
    passwordHint: string;
    confirmPasswordLabel: string;
    confirmPasswordPh: string;
    agreeToTermsPart1: string;
    agreeToTermsPart2: string;
    submit: string;
    submitting: string;
    or: string;
    googleBtn: string;
    appleBtn: string;
    hasAccount: string;
    signIn: string;
    privacy: string;
    terms: string;
    termsAccept: string;
    termsAnd: string;
  }
> = {
  de: {
    heading: 'Anmelden oder Registrieren',
    loginTab: 'Anmelden',
    registerTab: 'Registrieren',
    registerSubtitle:
      'Wähle deine Rolle und erstelle in wenigen Sekunden ein Konto.',
    rolePrompt: 'Ich möchte...',
    jobSeekerTitle: 'Jobsuchende',
    jobSeekerDesc: 'Jobs finden und bewerben',
    employerTitle: 'Arbeitgeber',
    employerDesc: 'Jobs veröffentlichen & Bewerbungen verwalten',
    emailLabel: 'E-Mail-Adresse',
    emailPh: 'du@beispiel.com',
    passwordLabel: 'Passwort',
    passwordPh: 'Mind. 6 Zeichen',
    passwordHint: 'Mind. 6 Zeichen',
    confirmPasswordLabel: 'Passwort bestätigen',
    confirmPasswordPh: 'Passwort wiederholen',
    agreeToTermsPart1: 'Ich akzeptiere die',
    agreeToTermsPart2: 'und',
    submit: 'Konto erstellen',
    submitting: 'Konto wird erstellt…',
    or: 'oder',
    googleBtn: 'Mit Google fortfahren',
    appleBtn: 'Mit Apple fortfahren',
    hasAccount: 'Schon ein Konto?',
    signIn: 'Jetzt anmelden',
    privacy: 'Datenschutz',
    terms: 'AGB',
    termsAccept: 'Mit der Registrierung akzeptierst du unsere',
    termsAnd: 'und',
  },
  en: {
    heading: 'Log in or Register',
    loginTab: 'Log in',
    registerTab: 'Register',
    registerSubtitle: 'Choose your role and create an account in seconds.',
    rolePrompt: 'I want to...',
    jobSeekerTitle: 'Job Seeker',
    jobSeekerDesc: 'Find and apply for jobs',
    employerTitle: 'Employer',
    employerDesc: 'Post jobs & manage applications',
    emailLabel: 'Email address',
    emailPh: 'you@example.com',
    passwordLabel: 'Password',
    passwordPh: 'Min. 6 characters',
    passwordHint: 'Min. 6 characters',
    confirmPasswordLabel: 'Confirm password',
    confirmPasswordPh: 'Repeat password',
    agreeToTermsPart1: 'I accept the',
    agreeToTermsPart2: 'and',
    submit: 'Create account',
    submitting: 'Creating account…',
    or: 'or',
    googleBtn: 'Continue with Google',
    appleBtn: 'Continue with Apple',
    hasAccount: 'Already have an account?',
    signIn: 'Sign in',
    privacy: 'Privacy',
    terms: 'Terms',
    termsAccept: 'By signing up you accept our',
    termsAnd: 'and',
  },
  fr: {
    heading: 'Se connecter ou s’inscrire',
    loginTab: 'Se connecter',
    registerTab: 'S’inscrire',
    registerSubtitle:
      'Choisissez votre rôle et créez un compte en quelques secondes.',
    rolePrompt: 'Je souhaite...',
    jobSeekerTitle: 'Candidat',
    jobSeekerDesc: "Trouver et postuler à des emplois",
    employerTitle: 'Employeur',
    employerDesc: 'Publier des offres & gérer les candidatures',
    emailLabel: 'Adresse e-mail',
    emailPh: 'vous@exemple.fr',
    passwordLabel: 'Mot de passe',
    passwordPh: 'Min. 6 caractères',
    passwordHint: 'Min. 6 caractères',
    confirmPasswordLabel: 'Confirmer le mot de passe',
    confirmPasswordPh: 'Répétez le mot de passe',
    agreeToTermsPart1: 'J’accepte les',
    agreeToTermsPart2: 'et la',
    submit: 'Créer le compte',
    submitting: 'Création du compte…',
    or: 'ou',
    googleBtn: 'Continuer avec Google',
    appleBtn: 'Continuer avec Apple',
    hasAccount: 'Vous avez déjà un compte ?',
    signIn: 'Se connecter',
    privacy: 'Confidentialité',
    terms: 'Conditions',
    termsAccept: 'En vous inscrivant vous acceptez nos',
    termsAnd: 'et',
  },
  it: {
    heading: 'Accedi o Registrati',
    loginTab: 'Accedi',
    registerTab: 'Registrati',
    registerSubtitle:
      'Scegli il tuo ruolo e crea un account in pochi secondi.',
    rolePrompt: 'Voglio...',
    jobSeekerTitle: 'Candidato',
    jobSeekerDesc: 'Trova e candidati per lavori',
    employerTitle: 'Datore di lavoro',
    employerDesc: 'Pubblica annunci & gestisci candidature',
    emailLabel: 'Indirizzo e-mail',
    emailPh: 'tu@esempio.com',
    passwordLabel: 'Password',
    passwordPh: 'Min. 6 caratteri',
    passwordHint: 'Min. 6 caratteri',
    confirmPasswordLabel: 'Conferma password',
    confirmPasswordPh: 'Ripeti la password',
    agreeToTermsPart1: 'Accetto i',
    agreeToTermsPart2: 'e la',
    submit: 'Crea account',
    submitting: 'Creazione account…',
    or: 'oppure',
    googleBtn: 'Continua con Google',
    appleBtn: 'Continua con Apple',
    hasAccount: 'Hai già un account?',
    signIn: 'Accedi',
    privacy: 'Privacy',
    terms: 'Termini',
    termsAccept: 'Registrandoti accetti le nostre',
    termsAnd: 'e',
  },
  sq: {
    heading: 'Hyni ose Regjistrohuni',
    loginTab: 'Hyni',
    registerTab: 'Regjistrohu',
    registerSubtitle:
      'Zgjidh rolin tënd dhe krijo një llogari në pak sekonda.',
    rolePrompt: 'Dua të...',
    jobSeekerTitle: 'Kërkues pune',
    jobSeekerDesc: 'Gjeni dhe aplikoni për punë',
    employerTitle: 'Punëdhënës',
    employerDesc: 'Publikoni punë & menaxhoni aplikimet',
    emailLabel: 'Adresa e emailit',
    emailPh: 'ti@shembull.com',
    passwordLabel: 'Fjalëkalimi',
    passwordPh: 'Min. 6 karaktere',
    passwordHint: 'Min. 6 karaktere',
    confirmPasswordLabel: 'Konfirmo fjalëkalimin',
    confirmPasswordPh: 'Përsërit fjalëkalimin',
    agreeToTermsPart1: 'Pranoj',
    agreeToTermsPart2: 'dhe',
    submit: 'Krijo llogarinë',
    submitting: 'Po krijohet…',
    or: 'ose',
    googleBtn: 'Vazhdo me Google',
    appleBtn: 'Vazhdo me Apple',
    hasAccount: 'Ke tashmë një llogari?',
    signIn: 'Hyni',
    privacy: 'Privatësia',
    terms: 'Kushtet',
    termsAccept: 'Duke u regjistruar pranon',
    termsAnd: 'dhe',
  },
};

const ERR_TEXT: Record<string, Record<Locale, string>> = {
  emailExists: {
    de: 'Diese E-Mail-Adresse ist bereits registriert.',
    en: 'This email is already registered.',
    fr: 'Cette adresse e-mail est déjà enregistrée.',
    it: 'Questa e-mail è già registrata.',
    sq: 'Ky email është i regjistruar tashmë.',
  },
  weakPassword: {
    de: 'Passwort zu schwach. Mindestens 6 Zeichen.',
    en: 'Password too weak. At least 6 characters.',
    fr: 'Mot de passe trop faible. Au moins 6 caractères.',
    it: 'Password troppo debole. Almeno 6 caratteri.',
    sq: 'Fjalëkalimi shumë i dobët. Të paktën 6 karaktere.',
  },
  invalidEmail: {
    de: 'Ungültige E-Mail-Adresse.',
    en: 'Invalid email address.',
    fr: 'Adresse e-mail invalide.',
    it: 'Indirizzo e-mail non valido.',
    sq: 'Email i pavlefshëm.',
  },
  networkError: {
    de: 'Verbindungsfehler. Bitte überprüfen Sie Ihre Internetverbindung.',
    en: 'Connection error. Please check your internet connection.',
    fr: 'Erreur de connexion. Vérifiez votre connexion internet.',
    it: 'Errore di connessione. Controlla la tua connessione internet.',
    sq: 'Gabim lidhjeje. Kontrolloni lidhjen tuaj me internetin.',
  },
  serverError: {
    de: 'Server vorübergehend nicht erreichbar.',
    en: 'Server temporarily unreachable.',
    fr: 'Serveur temporairement inaccessible.',
    it: 'Server temporaneamente non raggiungibile.',
    sq: 'Serveri përkohësisht i paarritshëm.',
  },
  registrationFailed: {
    de: 'Registrierung fehlgeschlagen. Bitte versuche es erneut.',
    en: 'Registration failed. Please try again.',
    fr: 'Inscription échouée. Veuillez réessayer.',
    it: 'Registrazione fallita. Riprova.',
    sq: 'Regjistrimi dështoi. Provoni përsëri.',
  },
  passwordMismatch: {
    de: 'Passwörter stimmen nicht überein.',
    en: 'Passwords do not match.',
    fr: 'Les mots de passe ne correspondent pas.',
    it: 'Le password non coincidono.',
    sq: 'Fjalëkalimet nuk përputhen.',
  },
  googleAuthFailed: {
    de: 'Google-Anmeldung fehlgeschlagen. Bitte erneut versuchen.',
    en: 'Google sign-in failed. Please try again.',
    fr: 'Connexion Google échouée. Veuillez réessayer.',
    it: 'Accesso Google fallito. Riprovare.',
    sq: 'Hyrja me Google dështoi. Provoni përsëri.',
  },
  appleAuthFailed: {
    de: 'Apple-Anmeldung fehlgeschlagen. Bitte erneut versuchen.',
    en: 'Apple sign-in failed. Please try again.',
    fr: 'Connexion Apple échouée. Veuillez réessayer.',
    it: 'Accesso Apple fallito. Riprovare.',
    sq: 'Hyrja me Apple dështoi. Provoni përsëri.',
  },
};

export default function RegisterScreen() {
  const { register, reload } = useAuth();
  const { locale } = useI18n();
  const dialog = useDialog();
  const router = useRouter();

  // Honour the role param the welcome-screen "Search" CTA passes (mirrors web's
  // /auth/register?role=...). When the role is preset, the role picker is
  // hidden so the user doesn't get asked something they already answered.
  const params = useLocalSearchParams<{ role?: string }>();
  const presetRole: AuthRole | null =
    params.role === 'employer'
      ? 'employer'
      : params.role === 'job-seeker'
        ? 'job-seeker'
        : null;
  const initialRole: AuthRole = presetRole ?? 'job-seeker';

  const l: Locale = (['de', 'en', 'fr', 'it', 'sq'] as const).includes(
    locale as Locale
  )
    ? (locale as Locale)
    : 'sq';
  const m = MARKETING[l];
  const ui = UI[l];

  const [role, setRole] = useState<AuthRole>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => {});
  }, []);

  const errorText = error
    ? ERR_TEXT[error]?.[l] ?? ERR_TEXT.registrationFailed[l]
    : null;

  const canSubmit =
    email.trim().length > 0 &&
    password.length >= 6 &&
    confirmPassword.length >= 6 &&
    agreedToTerms &&
    !submitting;

  async function onSubmit() {
    if (!canSubmit) return;
    if (password !== confirmPassword) {
      setError('passwordMismatch');
      return;
    }
    setError(null);
    setSubmitting(true);
    const result = await register(
      email.trim().toLowerCase(),
      password,
      role,
      undefined,
      l
    );
    setSubmitting(false);
    if (result.ok) {
      router.replace('/(tabs)' as any);
    } else {
      setError(result.error ?? 'registrationFailed');
    }
  }

  async function handleGoogleSignUp() {
    setGoogleLoading(true);
    try {
      const g = await signInWithGoogle();
      if (g.type === 'cancelled') return;
      if (g.type === 'error') {
        dialog.showError(`${g.code}\n${g.message}`, 'Google Sign-In');
        return;
      }
      let firebaseIdToken: string;
      try {
        const ex = await exchangeGoogleTokenForFirebase(g.idToken);
        firebaseIdToken = ex.firebaseIdToken;
      } catch (e: any) {
        dialog.showError(
          `Firebase exchange failed: ${e?.message || String(e)}`,
          'Google Sign-In'
        );
        return;
      }
      const res = await loginWithGoogle(firebaseIdToken, role, l);
      if (res.ok) {
        await reload();
        router.replace('/(tabs)' as any);
      } else {
        dialog.showError(
          `Backend rejected: ${(res as any).error ?? 'unknown'}`,
          'Google Sign-In'
        );
      }
    } catch (err: any) {
      dialog.showError(
        `${err?.message || String(err)}`,
        'Google Sign-In'
      );
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleAppleSignUp() {
    setAppleLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        dialog.showError('Apple gab kein Identity-Token zurück.', 'Apple Sign-In');
        return;
      }
      const res = await loginWithApple(
        credential.identityToken,
        credential.fullName ?? null,
        role,
        l
      );
      if (res.ok) {
        await reload();
        router.replace('/(tabs)' as any);
      } else {
        dialog.showError(
          `Backend rejected: ${(res as any).error ?? 'unknown'}`,
          'Apple Sign-In'
        );
      }
    } catch (err: any) {
      if (err?.code !== 'ERR_CANCELED' && err?.code !== 'ERR_REQUEST_CANCELED') {
        dialog.showError(
          `${err?.code || ''} ${err?.message || String(err)}`,
          'Apple Sign-In'
        );
      }
    } finally {
      setAppleLoading(false);
    }
  }

  const ROLES: {
    value: AuthRole;
    title: string;
    desc: string;
    icon: typeof Briefcase;
  }[] = [
    {
      value: 'job-seeker',
      title: ui.jobSeekerTitle,
      desc: ui.jobSeekerDesc,
      icon: UserIcon,
    },
    {
      value: 'employer',
      title: ui.employerTitle,
      desc: ui.employerDesc,
      icon: Briefcase,
    },
  ];

  return (
    <View className="flex-1 bg-[#F7F9FC]">
      {/* Top bar — matches login */}
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
            <Text className="text-[20px] font-extrabold leading-tight tracking-tight text-white">
              {m.title}
            </Text>
            <Text className="mt-2 text-[13px] font-medium leading-relaxed text-blue-100/60">
              {m.subtitle}
            </Text>
            <View className="mt-4 flex-row items-center" style={{ gap: 16 }}>
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <ShieldCheck color="#34D399" size={13} />
                <Text className="text-[11px] font-medium text-white/50">
                  {m.trust}
                </Text>
              </View>
              <View className="h-1 w-1 rounded-full bg-white/15" />
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <MapPin color="#93C5FD" size={13} />
                <Text className="text-[11px] font-medium text-white/50">
                  {m.region}
                </Text>
              </View>
            </View>
          </View>

          {/* Form Card */}
          <View
            className="mx-4 mt-6 overflow-hidden rounded-2xl border border-slate-200/60 bg-white px-5 py-7"
            style={{
              shadowColor: '#0B1F44',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.06,
              shadowRadius: 20,
              elevation: 3,
            }}
          >
            <Text className="text-[22px] font-extrabold leading-tight tracking-tight text-[#162C66]">
              {ui.heading}
            </Text>

            {/* Tabs (Login | Register) */}
            <View className="mt-6 flex-row items-center rounded-xl border border-[#E7EDF5] bg-[#F6F8FB] p-1">
              <Pressable
                onPress={() => router.replace('/(auth)/login' as any)}
                className="flex-1 rounded-[10px] py-3 active:opacity-80"
              >
                <Text className="text-center text-[13px] font-semibold text-slate-500">
                  {ui.loginTab}
                </Text>
              </Pressable>
              <Pressable
                className="flex-1 rounded-[10px] bg-white py-3"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                <Text className="text-center text-[13px] font-bold text-slate-900">
                  {ui.registerTab}
                </Text>
              </Pressable>
            </View>

            <Text className="mt-5 mb-6 text-[13px] font-medium leading-relaxed text-[#6B7A90]">
              {ui.registerSubtitle}
            </Text>

            {/* Error banner */}
            {errorText ? (
              <View className="mb-5 overflow-hidden rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <View className="flex-row items-start" style={{ gap: 10 }}>
                  <View className="mt-0.5 h-7 w-7 items-center justify-center rounded-lg bg-red-500">
                    <Text className="text-[12px] font-extrabold text-white">!</Text>
                  </View>
                  <Text className="flex-1 text-[12px] font-semibold leading-snug text-red-700">
                    {errorText}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Role selector — hidden when role is preset via URL param */}
            {presetRole === null ? (
              <>
                <Text className="mb-2 text-[12px] font-extrabold uppercase tracking-wider text-slate-500">
                  {ui.rolePrompt}
                </Text>
                <View className="mb-5 flex-row" style={{ gap: 10 }}>
                  {ROLES.map((r) => {
                    const active = role === r.value;
                    const Icon = r.icon;
                    return (
                      <Pressable
                        key={r.value}
                        onPress={() => setRole(r.value)}
                        className={`flex-1 rounded-xl border-2 p-3 ${
                          active
                            ? 'border-[#162C66] bg-[#162C66]'
                            : 'border-slate-200 bg-white'
                        }`}
                        style={
                          active
                            ? {
                                shadowColor: '#162C66',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.18,
                                shadowRadius: 10,
                                elevation: 3,
                              }
                            : undefined
                        }
                      >
                        <View
                          className={`mb-2 h-8 w-8 items-center justify-center rounded-lg ${
                            active ? 'bg-[#F5C400]' : 'bg-slate-100'
                          }`}
                        >
                          <Icon
                            color={active ? '#162C66' : '#64748B'}
                            size={16}
                            strokeWidth={2.4}
                          />
                        </View>
                        <Text
                          className={`text-[13px] font-bold ${
                            active ? 'text-white' : 'text-[#0B1F44]'
                          }`}
                        >
                          {r.title}
                        </Text>
                        <Text
                          className={`mt-0.5 text-[11px] font-medium ${
                            active ? 'text-blue-100/80' : 'text-slate-500'
                          }`}
                        >
                          {r.desc}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}

            {/* Email */}
            <View className="mb-4">
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

            {/* Password */}
            <View className="mb-2">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-[12px] font-extrabold uppercase tracking-wider text-slate-500">
                  {ui.passwordLabel} <Text className="text-red-500">*</Text>
                </Text>
                <Text className="text-[11px] font-medium text-slate-400">
                  {ui.passwordHint}
                </Text>
              </View>
              <View
                className="h-[56px] flex-row items-center rounded-xl border border-slate-200 bg-slate-50/80"
                style={{ paddingHorizontal: 14 }}
              >
                <View className="h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-white">
                  <Lock color="#64748B" size={16} />
                </View>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={ui.passwordPh}
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  autoComplete={Platform.OS === 'ios' ? 'password-new' : 'password-new'}
                  className="ml-3 flex-1 text-[15px] font-medium text-[#0B1F44]"
                  style={{ height: '100%' }}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  className="h-9 w-9 items-center justify-center rounded-lg active:bg-white"
                >
                  {showPassword ? (
                    <EyeOff color="#64748B" size={18} />
                  ) : (
                    <Eye color="#64748B" size={18} />
                  )}
                </Pressable>
              </View>
            </View>

            {/* Confirm Password */}
            <View className="mt-4 mb-2">
              <Text className="mb-2 text-[12px] font-extrabold uppercase tracking-wider text-slate-500">
                {ui.confirmPasswordLabel} <Text className="text-red-500">*</Text>
              </Text>
              <View
                className="h-[56px] flex-row items-center rounded-xl border border-slate-200 bg-slate-50/80"
                style={{ paddingHorizontal: 14 }}
              >
                <View className="h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-white">
                  <Lock color="#64748B" size={16} />
                </View>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder={ui.confirmPasswordPh}
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showConfirmPassword}
                  autoComplete={Platform.OS === 'ios' ? 'password-new' : 'password-new'}
                  className="ml-3 flex-1 text-[15px] font-medium text-[#0B1F44]"
                  style={{ height: '100%' }}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword((v) => !v)}
                  className="h-9 w-9 items-center justify-center rounded-lg active:bg-white"
                >
                  {showConfirmPassword ? (
                    <EyeOff color="#64748B" size={18} />
                  ) : (
                    <Eye color="#64748B" size={18} />
                  )}
                </Pressable>
              </View>
            </View>

            {/* Terms checkbox — required for registration (matches web) */}
            <Pressable
              onPress={() => setAgreedToTerms((v) => !v)}
              className="mt-5 flex-row items-start active:opacity-80"
              style={{ gap: 10 }}
            >
              <View
                className={`mt-0.5 h-5 w-5 items-center justify-center rounded-md border-2 ${
                  agreedToTerms
                    ? 'border-[#162C66] bg-[#162C66]'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {agreedToTerms ? (
                  <Text className="text-[12px] font-extrabold text-white">✓</Text>
                ) : null}
              </View>
              <Text
                className="flex-1 text-[12px] font-medium text-slate-600"
                style={{ lineHeight: 17 }}
              >
                {ui.agreeToTermsPart1}{' '}
                <Text
                  className="font-bold text-[#162C66]"
                  onPress={() => router.push('/legal/agb' as any)}
                >
                  {ui.terms}
                </Text>{' '}
                {ui.agreeToTermsPart2}{' '}
                <Text
                  className="font-bold text-[#162C66]"
                  onPress={() => router.push('/legal/privacy' as any)}
                >
                  {ui.privacy}
                </Text>
                .
              </Text>
            </Pressable>

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
                <ActivityIndicator color={canSubmit ? '#FFFFFF' : '#94A3B8'} />
              ) : (
                <Text
                  className={`text-[15px] font-extrabold ${
                    canSubmit ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {ui.submit}
                </Text>
              )}
            </Pressable>

            {/* OR divider */}
            <View
              className="mt-6 mb-5 flex-row items-center"
              style={{ gap: 12 }}
            >
              <View className="h-px flex-1 bg-slate-200" />
              <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {ui.or}
              </Text>
              <View className="h-px flex-1 bg-slate-200" />
            </View>

            {/* Apple Sign-In — required by App Store guideline 4.8 */}
            {appleAvailable ? (
              <Pressable
                onPress={handleAppleSignUp}
                disabled={appleLoading}
                className="mb-3 h-[52px] flex-row items-center justify-center rounded-xl bg-black active:opacity-90 disabled:opacity-60"
                style={{ gap: 8 }}
              >
                {appleLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <AppleLogo />
                )}
                <Text className="text-[14px] font-bold text-white">
                  {ui.appleBtn}
                </Text>
              </Pressable>
            ) : null}

            {/* Google */}
            <Pressable
              onPress={handleGoogleSignUp}
              disabled={googleLoading || !isGoogleAuthConfigured}
              className="h-[52px] flex-row items-center justify-center rounded-xl border border-slate-200 bg-white active:bg-slate-50 disabled:opacity-60"
              style={{ gap: 10 }}
            >
              {googleLoading ? (
                <ActivityIndicator color="#4285F4" size="small" />
              ) : (
                <GoogleLogo />
              )}
              <Text className="text-[14px] font-bold text-slate-700">
                {ui.googleBtn}
              </Text>
            </Pressable>

            {/* Sign-in link */}
            <View
              className="mt-6 flex-row items-center justify-center"
              style={{ gap: 6 }}
            >
              <Text className="text-[13px] font-medium text-slate-500">
                {ui.hasAccount}
              </Text>
              <Pressable
                onPress={() => router.replace('/(auth)/login' as any)}
                className="active:opacity-70"
              >
                <Text className="text-[13px] font-bold text-[#162C66]">
                  {ui.signIn}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Footer */}
          <View
            className="mt-6 flex-row items-center justify-center"
            style={{ gap: 24 }}
          >
            <Pressable
              onPress={() => router.push('/legal/privacy' as any)}
              className="active:opacity-70"
            >
              <Text className="text-[12px] font-medium text-slate-400">
                {ui.privacy}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/legal/agb' as any)}
              className="active:opacity-70"
            >
              <Text className="text-[12px] font-medium text-slate-400">
                {ui.terms}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/* Apple logo as SVG — Apple HIG requires their logo on Sign-in buttons */
function AppleLogo() {
  return (
    <Svg width={18} height={20} viewBox="0 0 384 512">
      <Path
        fill="#FFFFFF"
        d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
      />
    </Svg>
  );
}

/* Google G logo as SVG — matches the official Google color spec */
function GoogleLogo() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48">
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
}
