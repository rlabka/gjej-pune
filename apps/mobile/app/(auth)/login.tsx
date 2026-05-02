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
import Svg, { Path } from 'react-native-svg';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  ShieldCheck,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useDialog } from '@/contexts/DialogContext';
import {
  exchangeGoogleTokenForFirebase,
  isGoogleAuthConfigured,
  useGoogleAuthRequest,
} from '@/lib/firebase';
import { loginWithGoogle } from '@/lib/auth';

const LOGO_IMAGE = require('../../assets/images/logo.png');

type Locale = 'de' | 'en' | 'fr' | 'it' | 'sq';

const MARKETING: Record<Locale, {
  title: string;
  subtitle: string;
  trust: string;
  region: string;
}> = {
  de: {
    title: 'Finde schneller einen Job!',
    subtitle:
      'Eine ruhige, professionelle Plattform für Jobs in Europa — effizient, sicher und vertrauenswürdig.',
    trust: 'Sicher & vertrauenswürdig',
    region: 'Jobs in Europa',
  },
  en: {
    title: 'Find your next job faster!',
    subtitle:
      'A calm, professional platform for jobs in Europe — efficient, secure, and trustworthy.',
    trust: 'Secure & trustworthy',
    region: 'Jobs in Europe',
  },
  fr: {
    title: 'Trouvez votre prochain job plus vite !',
    subtitle:
      'Une plateforme calme et professionnelle pour l’Europe — efficace, sécurisée et fiable.',
    trust: 'Sûr & fiable',
    region: 'Emplois en Europe',
  },
  it: {
    title: 'Trova lavoro più velocemente!',
    subtitle:
      'Una piattaforma calma e professionale per l’Europa — efficiente, sicura e affidabile.',
    trust: 'Sicuro & affidabile',
    region: 'Lavoro in Europa',
  },
  sq: {
    title: 'Gjej punë më shpejt!',
    subtitle:
      'Një platformë e qetë dhe profesionale për punë në Evropë — efikase, e sigurt dhe e besueshme.',
    trust: 'E sigurt & e besueshme',
    region: 'Punë në Evropë',
  },
};

const UI: Record<Locale, {
  heading: string;
  loginTab: string;
  registerTab: string;
  loginSubtitle: string;
  emailLabel: string;
  emailPh: string;
  passwordLabel: string;
  passwordPh: string;
  forgotPassword: string;
  submit: string;
  or: string;
  googleBtn: string;
  privacy: string;
  terms: string;
}> = {
  de: {
    heading: 'Anmelden oder Registrieren',
    loginTab: 'Anmelden',
    registerTab: 'Registrieren',
    loginSubtitle:
      'Greifen Sie auf Ihr Dashboard zu, um Bewerbungen oder Recruiting zu verwalten.',
    emailLabel: 'E-Mail-Adresse',
    emailPh: 'du@beispiel.com',
    passwordLabel: 'Passwort',
    passwordPh: 'Ihr Passwort',
    forgotPassword: 'Passwort vergessen?',
    submit: 'Anmelden',
    or: 'oder',
    googleBtn: 'Mit Google fortfahren',
    privacy: 'Datenschutz',
    terms: 'AGB',
  },
  en: {
    heading: 'Log in or Register',
    loginTab: 'Log in',
    registerTab: 'Register',
    loginSubtitle:
      'Access your dashboard to manage applications or recruiting.',
    emailLabel: 'Email address',
    emailPh: 'you@example.com',
    passwordLabel: 'Password',
    passwordPh: 'Your password',
    forgotPassword: 'Forgot password?',
    submit: 'Log in',
    or: 'or',
    googleBtn: 'Continue with Google',
    privacy: 'Privacy',
    terms: 'Terms',
  },
  fr: {
    heading: 'Se connecter ou s’inscrire',
    loginTab: 'Se connecter',
    registerTab: 'S’inscrire',
    loginSubtitle:
      'Accédez à votre tableau de bord pour gérer vos candidatures.',
    emailLabel: 'Adresse e-mail',
    emailPh: 'vous@exemple.fr',
    passwordLabel: 'Mot de passe',
    passwordPh: 'Votre mot de passe',
    forgotPassword: 'Mot de passe oublié ?',
    submit: 'Se connecter',
    or: 'ou',
    googleBtn: 'Continuer avec Google',
    privacy: 'Confidentialité',
    terms: 'Conditions',
  },
  it: {
    heading: 'Accedi o Registrati',
    loginTab: 'Accedi',
    registerTab: 'Registrati',
    loginSubtitle:
      'Accedi alla tua dashboard per gestire candidature.',
    emailLabel: 'Indirizzo e-mail',
    emailPh: 'tu@esempio.com',
    passwordLabel: 'Password',
    passwordPh: 'La tua password',
    forgotPassword: 'Password dimenticata?',
    submit: 'Accedi',
    or: 'oppure',
    googleBtn: 'Continua con Google',
    privacy: 'Privacy',
    terms: 'Termini',
  },
  sq: {
    heading: 'Hyni ose Regjistrohuni',
    loginTab: 'Hyni',
    registerTab: 'Regjistrohu',
    loginSubtitle:
      'Hyni në panelin tuaj për të menaxhuar aplikimet ose rekrutimin.',
    emailLabel: 'Adresa e emailit',
    emailPh: 'ti@shembull.com',
    passwordLabel: 'Fjalëkalimi',
    passwordPh: 'Fjalëkalimi juaj',
    forgotPassword: 'Harruat fjalëkalimin?',
    submit: 'Hyni',
    or: 'ose',
    googleBtn: 'Vazhdo me Google',
    privacy: 'Privatësia',
    terms: 'Kushtet',
  },
};

const ERR_TEXT: Record<string, Record<Locale, string>> = {
  invalidCredentials: {
    de: 'E-Mail oder Passwort ist falsch.',
    en: 'Invalid email or password.',
    fr: 'E-mail ou mot de passe incorrect.',
    it: 'E-mail o password non validi.',
    sq: 'Email ose fjalëkalim i pasaktë.',
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
  googleAuthFailed: {
    de: 'Google-Anmeldung fehlgeschlagen. Bitte erneut versuchen.',
    en: 'Google sign-in failed. Please try again.',
    fr: 'Connexion Google échouée. Veuillez réessayer.',
    it: 'Accesso Google fallito. Riprovare.',
    sq: 'Hyrja me Google dështoi. Provoni përsëri.',
  },
};

export default function LoginScreen() {
  const { login, refresh } = useAuth();
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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google OAuth — useAuthRequest must be called at the top level
  const [googleRequest, googleResponse, promptGoogle] = useGoogleAuthRequest();

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  async function onSubmit() {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    const result = await login(email.trim().toLowerCase(), password);
    setSubmitting(false);
    if (result.ok) {
      router.replace('/(tabs)');
    } else {
      setError(result.error ?? 'invalidCredentials');
    }
  }

  function getErrorText(): string | null {
    if (!error) return null;
    return ERR_TEXT[error]?.[l] ?? ERR_TEXT.invalidCredentials[l];
  }

  async function handleGoogleLogin() {
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
        // user cancelled or error
        if (result.type === 'error') {
          setError('googleAuthFailed');
        }
        return;
      }
      const googleIdToken =
        result.authentication?.idToken ?? (result.params as any)?.id_token;
      if (!googleIdToken) {
        setError('googleAuthFailed');
        return;
      }
      // Exchange Google ID token → Firebase ID token via REST API
      const { firebaseIdToken } = await exchangeGoogleTokenForFirebase(
        googleIdToken
      );
      // Default to job-seeker for first-time Google sign-in (web does the same)
      const res = await loginWithGoogle(firebaseIdToken, 'job-seeker', l);
      if (res.ok) {
        await refresh();
        router.replace('/(tabs)');
      } else {
        setError((res as any).error ?? 'googleAuthFailed');
      }
    } catch (err) {
      console.error('[GoogleAuth] failed:', err);
      setError('googleAuthFailed');
    } finally {
      setGoogleLoading(false);
    }
  }

  const errorText = getErrorText();

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
          {/* Mobile branding hero — gradient navy strip */}
          <View className="overflow-hidden bg-[#0B1F44] px-6 py-6">
            <Text className="text-[20px] font-extrabold leading-tight tracking-tight text-white">
              {m.title}
            </Text>
            <Text className="mt-2 text-[13px] font-medium leading-relaxed text-blue-100/60">
              {m.subtitle}
            </Text>
            <View
              className="mt-4 flex-row items-center"
              style={{ gap: 16 }}
            >
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

            {/* Tabs */}
            <View className="mt-6 flex-row items-center rounded-xl border border-[#E7EDF5] bg-[#F6F8FB] p-1">
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
                  {ui.loginTab}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.replace('/(auth)/register' as any)}
                className="flex-1 rounded-[10px] py-3 active:opacity-80"
              >
                <Text className="text-center text-[13px] font-semibold text-slate-500">
                  {ui.registerTab}
                </Text>
              </Pressable>
            </View>

            <Text className="mt-5 mb-6 text-[13px] font-medium leading-relaxed text-[#6B7A90]">
              {ui.loginSubtitle}
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

            {/* Email */}
            <View className="mb-4">
              <Text className="mb-2 text-[12px] font-extrabold uppercase tracking-wider text-slate-500">
                {ui.emailLabel} <Text className="text-red-500">*</Text>
              </Text>
              <View
                className="h-[56px] flex-row items-center rounded-xl border border-slate-200 bg-slate-50/80"
                style={{ paddingHorizontal: 14 }}
              >
                <View className="h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-200/80">
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
                <Pressable
                  onPress={() => router.push('/(auth)/forgot-password' as any)}
                  className="active:opacity-70"
                >
                  <Text className="text-[12px] font-bold text-[#162C66]">
                    {ui.forgotPassword}
                  </Text>
                </Pressable>
              </View>
              <View
                className="h-[56px] flex-row items-center rounded-xl border border-slate-200 bg-slate-50/80"
                style={{ paddingHorizontal: 14 }}
              >
                <View className="h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-200/80">
                  <Lock color="#64748B" size={16} />
                </View>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={ui.passwordPh}
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  autoComplete={Platform.OS === 'ios' ? 'password' : 'current-password'}
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
              onPress={handleGoogleLogin}
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
