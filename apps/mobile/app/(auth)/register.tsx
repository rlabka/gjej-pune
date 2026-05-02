import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import {
  Briefcase,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useDialog } from '@/contexts/DialogContext';
import {
  exchangeGoogleTokenForFirebase,
  isGoogleAuthConfigured,
  useGoogleAuthRequest,
} from '@/lib/firebase';
import { loginWithGoogle, type AuthRole } from '@/lib/auth';

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
    nameLabel: string;
    namePh: string;
    emailLabel: string;
    emailPh: string;
    passwordLabel: string;
    passwordPh: string;
    passwordHint: string;
    submit: string;
    submitting: string;
    or: string;
    googleBtn: string;
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
    jobSeekerTitle: 'Jobs finden',
    jobSeekerDesc: 'Bewerbungen verwalten',
    employerTitle: 'Talente einstellen',
    employerDesc: 'Stellen ausschreiben',
    nameLabel: 'Name',
    namePh: 'Max Mustermann',
    emailLabel: 'E-Mail-Adresse',
    emailPh: 'du@beispiel.com',
    passwordLabel: 'Passwort',
    passwordPh: 'Mind. 6 Zeichen',
    passwordHint: 'Mind. 6 Zeichen',
    submit: 'Konto erstellen',
    submitting: 'Konto wird erstellt…',
    or: 'oder',
    googleBtn: 'Mit Google fortfahren',
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
    jobSeekerTitle: 'Find jobs',
    jobSeekerDesc: 'Manage applications',
    employerTitle: 'Hire talent',
    employerDesc: 'Post job listings',
    nameLabel: 'Name',
    namePh: 'John Smith',
    emailLabel: 'Email address',
    emailPh: 'you@example.com',
    passwordLabel: 'Password',
    passwordPh: 'Min. 6 characters',
    passwordHint: 'Min. 6 characters',
    submit: 'Create account',
    submitting: 'Creating account…',
    or: 'or',
    googleBtn: 'Continue with Google',
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
    jobSeekerTitle: 'Trouver un emploi',
    jobSeekerDesc: 'Gérer les candidatures',
    employerTitle: 'Recruter',
    employerDesc: 'Publier des offres',
    nameLabel: 'Nom',
    namePh: 'Jean Dupont',
    emailLabel: 'Adresse e-mail',
    emailPh: 'vous@exemple.fr',
    passwordLabel: 'Mot de passe',
    passwordPh: 'Min. 6 caractères',
    passwordHint: 'Min. 6 caractères',
    submit: 'Créer le compte',
    submitting: 'Création du compte…',
    or: 'ou',
    googleBtn: 'Continuer avec Google',
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
    jobSeekerTitle: 'Trovare lavoro',
    jobSeekerDesc: 'Gestire le candidature',
    employerTitle: 'Assumere talenti',
    employerDesc: 'Pubblicare annunci',
    nameLabel: 'Nome',
    namePh: 'Mario Rossi',
    emailLabel: 'Indirizzo e-mail',
    emailPh: 'tu@esempio.com',
    passwordLabel: 'Password',
    passwordPh: 'Min. 6 caratteri',
    passwordHint: 'Min. 6 caratteri',
    submit: 'Crea account',
    submitting: 'Creazione account…',
    or: 'oppure',
    googleBtn: 'Continua con Google',
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
    jobSeekerTitle: 'Gjej punë',
    jobSeekerDesc: 'Menaxho aplikimet',
    employerTitle: 'Punësoj talente',
    employerDesc: 'Publikoj shpallje',
    nameLabel: 'Emri',
    namePh: 'Filan Fisteku',
    emailLabel: 'Adresa e emailit',
    emailPh: 'ti@shembull.com',
    passwordLabel: 'Fjalëkalimi',
    passwordPh: 'Min. 6 karaktere',
    passwordHint: 'Min. 6 karaktere',
    submit: 'Krijo llogarinë',
    submitting: 'Po krijohet…',
    or: 'ose',
    googleBtn: 'Vazhdo me Google',
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
  googleAuthFailed: {
    de: 'Google-Anmeldung fehlgeschlagen. Bitte erneut versuchen.',
    en: 'Google sign-in failed. Please try again.',
    fr: 'Connexion Google échouée. Veuillez réessayer.',
    it: 'Accesso Google fallito. Riprovare.',
    sq: 'Hyrja me Google dështoi. Provoni përsëri.',
  },
};

export default function RegisterScreen() {
  const { register } = useAuth();
  const { locale } = useI18n();
  const dialog = useDialog();
  const router = useRouter();

  const l: Locale = (['de', 'en', 'fr', 'it', 'sq'] as const).includes(
    locale as Locale
  )
    ? (locale as Locale)
    : 'sq';
  const m = MARKETING[l];
  const ui = UI[l];

  const [role, setRole] = useState<AuthRole>('job-seeker');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [googleRequest, , promptGoogle] = useGoogleAuthRequest();

  const errorText = error
    ? ERR_TEXT[error]?.[l] ?? ERR_TEXT.registrationFailed[l]
    : null;

  const canSubmit =
    email.trim().length > 0 &&
    password.length >= 6 &&
    !submitting;

  async function onSubmit() {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    const result = await register(
      email.trim().toLowerCase(),
      password,
      role,
      displayName.trim() || undefined,
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
    if (!isGoogleAuthConfigured) {
      dialog.show({
        variant: 'info',
        title: 'Google Sign-In',
        message:
          'Google login ist noch nicht konfiguriert. Setze EXPO_PUBLIC_FIREBASE_API_KEY und EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in apps/mobile/.env',
      });
      return;
    }
    if (!googleRequest) return;
    setGoogleLoading(true);
    try {
      const result = await promptGoogle();
      if (result.type !== 'success') {
        if (result.type === 'error') {
          setError('googleAuthFailed');
        }
        return;
      }
      const googleIdToken =
        (result.params as any)?.id_token ??
        (result.authentication as any)?.idToken;
      if (!googleIdToken) {
        setError('googleAuthFailed');
        return;
      }
      const { firebaseIdToken } = await exchangeGoogleTokenForFirebase(
        googleIdToken
      );
      const res = await loginWithGoogle(firebaseIdToken, role, l);
      if (res.ok) {
        router.replace('/(tabs)' as any);
      } else {
        setError(res.error ?? 'googleAuthFailed');
      }
    } catch {
      setError('googleAuthFailed');
    } finally {
      setGoogleLoading(false);
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

            {/* Role selector */}
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

            {/* Name */}
            <View className="mb-4">
              <Text className="mb-2 text-[12px] font-extrabold uppercase tracking-wider text-slate-500">
                {ui.nameLabel}
              </Text>
              <View
                className="h-[56px] flex-row items-center rounded-xl border border-slate-200 bg-slate-50/80"
                style={{ paddingHorizontal: 14 }}
              >
                <View className="h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-white">
                  <UserIcon color="#64748B" size={16} />
                </View>
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder={ui.namePh}
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="words"
                  autoComplete="name"
                  className="ml-3 flex-1 text-[15px] font-medium text-[#0B1F44]"
                  style={{ height: '100%' }}
                />
              </View>
            </View>

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

            {/* Terms hint */}
            <Text
              className="mt-4 text-[11px] font-medium leading-snug text-slate-500"
              style={{ lineHeight: 16 }}
            >
              {ui.termsAccept}{' '}
              <Text
                className="font-bold text-[#162C66]"
                onPress={() => router.push('/legal/agb' as any)}
              >
                {ui.terms}
              </Text>{' '}
              {ui.termsAnd}{' '}
              <Text
                className="font-bold text-[#162C66]"
                onPress={() => router.push('/legal/privacy' as any)}
              >
                {ui.privacy}
              </Text>
              .
            </Text>

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

            {/* Google */}
            <Pressable
              onPress={handleGoogleSignUp}
              disabled={googleLoading || !googleRequest}
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
