'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import Button from '@/components/ui/Button';
import { getSession, login, loginWithGoogle, logout, register, updateRole, clearSession, type AuthRole } from '@/lib/auth';
import { signInWithGoogle } from '@/lib/firebase';
import { getJobSeekerConfig } from '@/lib/siteConfig';
import { clsx } from 'clsx';
import { User, Building2, Eye, EyeOff } from 'lucide-react';

type Mode = 'login' | 'register';
type Stage = 'email' | 'details'; // kept for type safety if needed, but logic is simplified

type Props = {
  initialMode: Mode;
  reasonBanned?: boolean;
  /** Which role the registration page should target */
  registrationRole?: 'job-seeker' | 'employer';
  /** URL to redirect back to after login (e.g. from favorite redirect) */
  returnUrl?: string;
};

export default function AuthUnified({ initialMode, reasonBanned, registrationRole, returnUrl }: Props) {
  const locale = useLocale();
  const router = useRouter();

  const loginT = useTranslations('auth.login');
  const registerT = useTranslations('auth.register');
  const errorsT = useTranslations('auth.errors');
  const rolesT = useTranslations('auth.roles');
  const commonT = useTranslations('auth.common');

  const [mode, setMode] = useState<Mode>(initialMode);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<AuthRole>(registrationRole ?? 'job-seeker');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGoogleRolePicker, setShowGoogleRolePicker] = useState(false);
  const [googleRole, setGoogleRole] = useState<AuthRole | null>(null);
  const [pendingGoogleNewAccount, setPendingGoogleNewAccount] = useState(false);
  const successRedirectFn = useRef<(() => void) | null>(null);

  const passwordRef = useRef<HTMLInputElement | null>(null);

  const ui = useMemo(() => {
    const copy = {
      de: {
        heading: 'Anmelden oder Registrieren',
        emailLabel: 'E-Mail-Adresse',
        continue: 'Weiter',
        or: 'oder',
        social: ['Google', 'LinkedIn', 'Facebook', 'Apple'],
        legal:
          'Mit deiner Registrierung stimmst du unseren Nutzungsbedingungen zu. Mehr Infos findest du in unserer Datenschutzerklärung.',
        recruiter: 'Recruiter anmelden',
        adminPanel: 'Admin-Bereich',
        editEmail: 'E-Mail ändern',
        jobSeekerTitle: 'Jobsuchende',
        jobSeekerDesc: 'Jobs finden und bewerben',
        employerTitle: 'Arbeitgeber',
        employerDesc: 'Jobs veröffentlichen & Bewerbungen verwalten',
        createAccount: 'Konto erstellen',
        createJobProfile: 'Jobprofil erstellen',
        createEmployerAccount: 'Unternehmenskonto erstellen',
        forgotPassword: 'Passwort vergessen?',
        agreeToTerms: (
          <>
            Ich akzeptiere die <a href="#" className="text-[#162C66] hover:underline font-medium">AGB</a> und <a href="#" className="text-[#162C66] hover:underline font-medium">Datenschutzbestimmungen</a>.
          </>
        ),
      },
      en: {
        heading: 'Log in or Register',
        emailLabel: 'Email address',
        continue: 'Continue',
        or: 'or',
        social: ['Google', 'LinkedIn', 'Facebook', 'Apple'],
        legal: 'By continuing, you agree to our Terms and acknowledge our Privacy Policy.',
        recruiter: 'Recruiter login',
        adminPanel: 'Admin panel',
        editEmail: 'Edit email',
        jobSeekerTitle: 'Job Seeker',
        jobSeekerDesc: 'Find and apply for jobs',
        employerTitle: 'Employer',
        employerDesc: 'Post jobs & manage applications',
        createAccount: 'Create account',
        createJobProfile: 'Create your Job Profile',
        createEmployerAccount: 'Create employer account',
        forgotPassword: 'Forgot password?',
        agreeToTerms: (
          <>
            I accept the <a href="#" className="text-[#162C66] hover:underline font-medium">Terms</a> and <a href="#" className="text-[#162C66] hover:underline font-medium">Privacy Policy</a>.
          </>
        ),
      },
      fr: {
        heading: 'Se connecter ou s’inscrire',
        emailLabel: 'Adresse e-mail',
        continue: 'Continuer',
        or: 'ou',
        social: ['Google', 'LinkedIn', 'Facebook', 'Apple'],
        legal:
          'En continuant, vous acceptez nos Conditions et reconnaissez notre Politique de confidentialité.',
        recruiter: 'Connexion recruteur',
        adminPanel: 'Espace admin',
        editEmail: 'Modifier l’e-mail',
        jobSeekerTitle: 'Candidat',
        jobSeekerDesc: 'Trouver et postuler à des emplois',
        employerTitle: 'Employeur',
        employerDesc: 'Publier des offres & gérer les candidatures',
        createAccount: 'Créer un compte',
        createJobProfile: 'Créer votre profil emploi',
        createEmployerAccount: 'Créer un compte entreprise',
        forgotPassword: 'Mot de passe oublié ?',
        agreeToTerms: (
          <>
            J’accepte les <a href="#" className="text-[#162C66] hover:underline font-medium">conditions</a> et la <a href="#" className="text-[#162C66] hover:underline font-medium">politique de confidentialité</a>.
          </>
        ),
      },
      it: {
        heading: 'Accedi o Registrati',
        emailLabel: 'Indirizzo email',
        continue: 'Continua',
        or: 'oppure',
        social: ['Google', 'LinkedIn', 'Facebook', 'Apple'],
        legal: 'Continuando, accetti i Termini e prendi visione della Privacy Policy.',
        recruiter: 'Accesso recruiter',
        adminPanel: 'Pannello admin',
        editEmail: 'Modifica email',
        jobSeekerTitle: 'Candidato',
        jobSeekerDesc: 'Trova e candidati per lavori',
        employerTitle: 'Datore di lavoro',
        employerDesc: 'Pubblica annunci & gestisci candidature',
        createAccount: 'Crea account',
        createJobProfile: 'Crea il tuo profilo lavoro',
        createEmployerAccount: 'Crea account aziendale',
        forgotPassword: 'Password dimenticata?',
        agreeToTerms: (
          <>
            Accetto i <a href="#" className="text-[#162C66] hover:underline font-medium">Termini</a> e la <a href="#" className="text-[#162C66] hover:underline font-medium">Privacy Policy</a>.
          </>
        ),
      },
      sq: {
        heading: 'Identifikohuni ose Regjistrohuni',
        emailLabel: 'Adresa e emailit',
        continue: 'Vazhdo',
        or: 'ose',
        social: ['Google', 'LinkedIn', 'Facebook', 'Apple'],
        legal: 'Duke vazhduar, ju pranoni Kushtet tona dhe pranoni Politikën tonë të Privatësisë.',
        recruiter: 'Hyrja e rekrutuesit',
        adminPanel: 'Paneli i adminit',
        editEmail: 'Ndrysho emailin',
        jobSeekerTitle: 'Kërkues pune',
        jobSeekerDesc: 'Gjeni dhe aplikoni për punë',
        employerTitle: 'Punëdhënës',
        employerDesc: 'Publikoni punë & menaxhoni aplikimet',
        createAccount: 'Krijo llogarinë',
        createJobProfile: 'Krijo profilin tuaj të punës',
        createEmployerAccount: 'Krijo llogari biznesi',
        forgotPassword: 'Keni harruar fjalëkalimin?',
        agreeToTerms: (
          <>
            Pranoj <a href="#" className="text-[#162C66] hover:underline font-medium">Kushtet</a> dhe <a href="#" className="text-[#162C66] hover:underline font-medium">Politikën e Privatësisë</a>.
          </>
        ),
      }
    } as const;

    return copy[(locale as keyof typeof copy) ?? 'de'] ?? copy.de;
  }, [locale]);

  const isRedirecting = useRef(false);

  useEffect(() => {
    if (isRedirecting.current) return;
    const s = getSession();
    if (s?.isAuthenticated) {
      if (s.role === 'admin') {
        window.location.href = `/${locale}/admin`;
        return;
      }
      if (s.role === 'employer') router.replace('/dashboard/employer', { locale });
      else router.replace('/dashboard/job-seeker', { locale });
    }
  }, [locale, router]);

  useEffect(() => {
    // When mode changes, reset flow.
    setPassword('');
    setConfirmPassword('');
    setErrorKey(null);
    setSuccessMsg(null);
    setAgreedToTerms(false);
  }, [mode]);

  const canSubmit = useMemo(() => {
    if (isSubmitting) return false;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (mode === 'login') return emailOk && password.length > 0;
    
    // Register checks
    if (!emailOk || !password || !confirmPassword) return false;
    if (password !== confirmPassword) return false;
    if (!agreedToTerms) return false;
    
    return true;
  }, [confirmPassword, email, isSubmitting, mode, password, agreedToTerms]);

  // ─── Email domain validation ──────────────────────────────────
  function validateEmailDomain(emailAddr: string): boolean {
    const trimmed = emailAddr.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return false;

    const domain = trimmed.split('@')[1];
    if (!domain) return false;

    // Must have at least one dot and TLD >= 2 letters (only letters)
    const parts = domain.split('.');
    if (parts.length < 2) return false;
    const tld = parts[parts.length - 1];
    if (!/^[a-zA-Z]{2,}$/.test(tld)) return false;

    // Domain name (before TLD) must contain at least one letter (rejects 123.ch)
    const domainName = parts.slice(0, -1).join('.');
    if (!/[a-zA-Z]/.test(domainName)) return false;

    // Common typo domains to reject
    const typos = [
      // Gmail
      'gmail.con','gmail.co','gmail.cm','gmail.cpm','gmail.vom','gmail.om','gmail.cim','gmail.xom','gmail.dom',
      'gmai.com','gmial.com','gnail.com','gamil.com','gmaill.com','gmil.com','gmal.com','gail.com','gemail.com','gimail.com',
      // Hotmail
      'hotmail.con','hotmail.co','hotmial.com','hotmal.com','hotmai.com','hotamil.com','hotmaill.com','homail.com','htmail.com',
      // Outlook
      'outlook.con','outloock.com','outloo.com','outlok.com','outllook.com','outlool.com','outlo.de','outlok.de',
      // Yahoo
      'yahoo.con','yahooo.com','yaho.com','yaoo.com','yhoo.com','yahho.com',
      // iCloud
      'icloud.con','icloud.co','iclould.com','iclod.com','icoud.com',
      // GMX
      'gmx.con','gmx.ce','gmx.cha','gmx.ed','gmx.dee','gmx.da','gmx.ta','gmx.ant','gmx.ent',
      // Bluewin
      'bluewin.con','bluewin.ce','bluewin.cj','bluwin.ch','bluwein.ch','blewin.ch',
      // Protonmail
      'protonmail.con','protonmal.com','protonmial.com','protonmil.com','proton.em','proton.mee','proton.ne',
      // Web.de / T-Online
      'web.ed','web.dee','web.da','t-online.ed','t-online.dee','tonline.de','t-onlline.de',
      // Live / MSN
      'live.con','live.co','live.cm','msn.con','msn.co',
      // Albanische / Kosovarische Anbieter
      'kujtesa.con','kujtesa.co','kujtesa.cm','kujtsa.com','kujtessa.com','kujtes.com',
      'ipko.ent','ipko.nt','ipko.ne','ikpo.net','ipk.net','ipo.net',
      'albmail.con','albmail.co','albmal.com','albamail.com',
      'abcom.la','abcom.a','abcm.al',
      'albtelecom.la','albtelecom.a','albtelcom.al','albtelekon.al',
      'abissnet.la','abissnet.a','abisnet.al','abissnt.al',
      'yahoo.co','yahoo.cm','hotmail.cm','hotmail.om',
    ];
    if (typos.includes(domain)) return false;

    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorKey(null);
    setSuccessMsg(null);

    // Validate email domain before submitting
    if (!validateEmailDomain(email)) {
      setErrorKey('invalidEmail');
      return;
    }

    setIsSubmitting(true);

    if (mode === 'login') {
      const res = await login(email.trim(), password);
      if (!res.ok) {
        setIsSubmitting(false);
        setErrorKey(res.error);
        return;
      }

      const session = getSession();
      const finalRole = session?.role ?? res.role ?? 'job-seeker';

      if (finalRole === 'job-seeker') {
        const jsConfig = getJobSeekerConfig();
        if (!jsConfig.access.allowLogin) {
          await logout();
          setIsSubmitting(false);
          setErrorKey('loginDisabled');
          return;
        }
        const emailLower = session?.email?.toLowerCase() ?? '';
        if (jsConfig.access.bannedEmails.some((x) => x.toLowerCase() === emailLower)) {
          await logout();
          setIsSubmitting(false);
          setErrorKey('banned');
          return;
        }
      }

      if (finalRole === 'admin') {
        window.location.href = `/${locale}/admin`;
        return;
      }

      // If returnUrl is provided (e.g. from favorite redirect), go back there
      if (returnUrl) {
        window.location.href = returnUrl;
        return;
      }

      if (finalRole === 'employer') router.replace('/dashboard/employer', { locale });
      else router.replace('/dashboard/job-seeker', { locale });
      return;
    }

    // register
    if (password !== confirmPassword) {
      setIsSubmitting(false);
      setErrorKey('passwordMismatch');
      return;
    }

    if (role === 'job-seeker' && !getJobSeekerConfig().access.allowRegistration) {
      setIsSubmitting(false);
      setErrorKey('registrationDisabled');
      return;
    }

    const res = await register(email.trim(), password, role, undefined, locale);
    if (!res.ok) {
      setIsSubmitting(false);
      setErrorKey(res.error);
      return;
    }

    isRedirecting.current = true;

    // Store redirect and show success dialog — user must confirm
    // New registrations ALWAYS go to dashboard/onboarding, never to returnUrl
    successRedirectFn.current = () => {
      if (role === 'admin') { window.location.href = `/${locale}/admin`; return; }
      if (role === 'employer') { window.location.href = `/${locale}/dashboard/employer/jobs/new`; }
      else { window.location.href = `/${locale}/dashboard/job-seeker/my-ads?create=1`; }
    };
    setSuccessMsg('created');
  }

  // ─── Google Sign-In handler ───────────────────────────────────
  function handleGoogleClick() {
    // Only show role picker for new registrations (register mode) when role is not preset.
    // On login mode: backend uses the stored role — no picker needed.
    if (!registrationRole && mode === 'register') {
      setShowGoogleRolePicker(true);
      return;
    }
    handleGoogleSignIn(role);
  }

  async function handleGoogleSignIn(selectedRole: AuthRole) {
    setShowGoogleRolePicker(false);
    setErrorKey(null);
    setSuccessMsg(null);
    setGoogleLoading(true);
    try {
      const googleResult = await signInWithGoogle();
      const res = await loginWithGoogle(googleResult.idToken, selectedRole, locale);
      if (!res.ok) {
        setGoogleLoading(false);
        setErrorKey(res.error);
        return;
      }

      const session = getSession();
      const finalRole = session?.role ?? res.role ?? 'job-seeker';

      if (finalRole === 'job-seeker') {
        const jsConfig = getJobSeekerConfig();
        if (!jsConfig.access.allowLogin) {
          await logout();
          setGoogleLoading(false);
          setErrorKey('loginDisabled');
          return;
        }
      }

      // Register page: if account already exists, show error (same as normal email registration)
      if (!res.isNew && mode === 'register') {
        await logout();
        setGoogleLoading(false);
        setErrorKey('emailExists');
        return;
      }

      isRedirecting.current = true;

      // New Google account on LOGIN page — role was not explicitly chosen.
      // Show role picker so user can choose, then update via API.
      if (res.isNew && mode === 'login') {
        // Clear session so a page reload won't auto-redirect before role is chosen.
        // Token is kept so updateRole() can still call the API.
        clearSession();
        setGoogleLoading(false);
        setPendingGoogleNewAccount(true);
        setShowGoogleRolePicker(true);
        return;
      }

      completeGoogleRedirect(res.isNew, finalRole);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        // User closed popup — no error
      } else if (code === 'auth/popup-blocked') {
        setErrorKey('googlePopupBlocked');
      } else if (code === 'auth/network-request-failed') {
        setErrorKey('googleNetworkError');
      } else if (code === 'auth/internal-error' || code === 'auth/too-many-requests') {
        setErrorKey('googleInternalError');
      } else {
        setErrorKey('googleAuthFailed');
      }
      setGoogleLoading(false);
    }
  }

  function completeGoogleRedirect(isNew: boolean, finalRole: string) {
    const doRedirect = () => {
      if (finalRole === 'admin') { window.location.href = `/${locale}/admin`; return; }
      if (isNew) {
        if (finalRole === 'employer') { window.location.href = `/${locale}/dashboard/employer/jobs/new`; }
        else { window.location.href = `/${locale}/dashboard/job-seeker/my-ads`; }
      } else {
        if (returnUrl) { window.location.href = returnUrl; return; }
        if (finalRole === 'employer') router.replace('/dashboard/employer', { locale });
        else router.replace('/dashboard/job-seeker', { locale });
      }
    };

    if (isNew) {
      successRedirectFn.current = doRedirect;
      setSuccessMsg('created');
    } else {
      doRedirect();
    }
  }

  async function handleGoogleRoleSelect(selectedRole: AuthRole) {
    setShowGoogleRolePicker(false);
    setGoogleLoading(true);

    if (pendingGoogleNewAccount) {
      // Account was already created — update the role via API
      const res = await updateRole(selectedRole);
      setPendingGoogleNewAccount(false);
      setGoogleLoading(false);
      if (!res.ok) {
        setErrorKey(res.error);
        isRedirecting.current = false;
        return;
      }
      completeGoogleRedirect(true, selectedRole);
    } else {
      // Normal register mode — proceed with Google sign-in
      handleGoogleSignIn(selectedRole);
    }
  }

  const activeFormT = mode === 'login' ? loginT : registerT;

  const inputCls = 'w-full h-[46px] sm:h-12 px-4 bg-white border border-[#E2E8F0] rounded-xl text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#162C66]/40 focus:ring-[3px] focus:ring-[#162C66]/10 transition-all duration-200';

  return (
    <div className="w-full">
      <h1 className="text-[22px] sm:text-[28px] font-extrabold text-[#162C66] tracking-tight leading-tight">
        {ui.heading}
      </h1>

      {/* Tabs */}
      <div className="mt-6 sm:mt-7 flex items-center gap-1 rounded-xl bg-[#F6F8FB] border border-[#E7EDF5] p-1">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            const qp = new URLSearchParams();
            if (returnUrl) qp.set('returnUrl', returnUrl);
            const qs = qp.toString();
            router.replace(`/auth/login${qs ? `?${qs}` : ''}`, { locale });
          }}
          className={clsx(
            'flex-1 rounded-[10px] px-3 sm:px-4 py-2.5 sm:py-3 text-[13px] sm:text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#162C66]/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
            mode === 'login'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          {loginT('title')}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('register');
            const qp = new URLSearchParams();
            if (registrationRole) qp.set('role', registrationRole);
            if (returnUrl) qp.set('returnUrl', returnUrl);
            const qs = qp.toString();
            router.replace(`/auth/register${qs ? `?${qs}` : ''}`, { locale });
          }}
          className={clsx(
            'flex-1 rounded-[10px] px-3 sm:px-4 py-2.5 sm:py-3 text-[13px] sm:text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#162C66]/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
            mode === 'register'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          {registerT('title')}
        </button>
      </div>

      <p className="mt-5 sm:mt-6 mb-6 sm:mb-7 text-[13px] sm:text-[15px] font-medium text-[#6B7A90] leading-relaxed">
        {mode === 'login' ? loginT('subtitle') : registerT('subtitle')}
      </p>

      {/* Role selector – only shown on register when registrationRole is NOT preset */}
      {mode === 'register' && !registrationRole && (
        <div className="mb-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole('job-seeker')}
            className={clsx(
              'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
              role === 'job-seeker'
                ? 'border-[#162C66] bg-[#162C66]/[0.04] shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            )}
          >
            <div className={clsx(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              role === 'job-seeker' ? 'bg-[#162C66]/10' : 'bg-slate-100'
            )}>
              <User size={20} className={role === 'job-seeker' ? 'text-[#162C66]' : 'text-slate-400'} />
            </div>
            <div className="text-center">
              <span className={clsx(
                'block text-[13px] sm:text-sm font-bold',
                role === 'job-seeker' ? 'text-[#162C66]' : 'text-slate-700'
              )}>
                {ui.jobSeekerTitle}
              </span>
              <span className="block text-[11px] text-slate-400 mt-0.5">{ui.jobSeekerDesc}</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setRole('employer')}
            className={clsx(
              'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
              role === 'employer'
                ? 'border-[#162C66] bg-[#162C66]/[0.04] shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            )}
          >
            <div className={clsx(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              role === 'employer' ? 'bg-[#162C66]/10' : 'bg-slate-100'
            )}>
              <Building2 size={20} className={role === 'employer' ? 'text-[#162C66]' : 'text-slate-400'} />
            </div>
            <div className="text-center">
              <span className={clsx(
                'block text-[13px] sm:text-sm font-bold',
                role === 'employer' ? 'text-[#162C66]' : 'text-slate-700'
              )}>
                {ui.employerTitle}
              </span>
              <span className="block text-[11px] text-slate-400 mt-0.5">{ui.employerDesc}</span>
            </div>
          </button>
        </div>
      )}

      {/* Success dialog — enterprise modal */}
      {successMsg && (() => {
        const successCopy = {
          de: { title: 'Willkommen bei gjej-pune!', subtitle: 'Ihr Konto wurde erfolgreich erstellt', desc: 'Im nächsten Schritt erstellen Sie Ihr Jobprofil — es dauert nur wenige Minuten.', cta: 'Jobprofil erstellen', steps: ['Konto erstellt', 'Profil erstellen', 'Loslegen'] },
          en: { title: 'Welcome to gjej-pune!', subtitle: 'Your account has been created successfully', desc: 'Next, create your job profile — it only takes a few minutes.', cta: 'Create Job Profile', steps: ['Account created', 'Create profile', 'Get started'] },
          fr: { title: 'Bienvenue sur gjej-pune !', subtitle: 'Votre compte a été créé avec succès', desc: 'Créez maintenant votre profil emploi — cela ne prend que quelques minutes.', cta: 'Créer profil emploi', steps: ['Compte créé', 'Créer profil', 'Commencer'] },
          it: { title: 'Benvenuto su gjej-pune!', subtitle: 'Il tuo account è stato creato con successo', desc: 'Ora crea il tuo profilo lavoro — bastano pochi minuti.', cta: 'Crea profilo lavoro', steps: ['Account creato', 'Crea profilo', 'Inizia'] },
          sq: { title: 'Mirë se vini në gjej-pune!', subtitle: 'Llogaria juaj u krijua me sukses', desc: 'Tani krijoni profilin tuaj të punës — duhen vetëm disa minuta.', cta: 'Krijo profil pune', steps: ['Llogaria u krijua', 'Krijo profilin', 'Fillo'] },
        } as const;
        const sc = successCopy[locale as keyof typeof successCopy] ?? successCopy.de;
        return (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', padding: '16px', animation: 'successFadeIn 0.3s ease-out' }}
          >
            <div
              style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '440px', overflow: 'hidden', boxShadow: '0 25px 60px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)', animation: 'successScaleIn 0.4s cubic-bezier(0.16,1,0.3,1)' }}
            >
              {/* Dark gradient header */}
              <div style={{ background: 'linear-gradient(135deg, #162C66 0%, #1a3578 50%, #0F1E45 100%)', padding: '40px 32px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                {/* Decorative orbs */}
                <div style={{ position: 'absolute', top: '-40px', right: '-20px', width: '160px', height: '160px', background: 'radial-gradient(circle, rgba(245,196,0,0.12) 0%, transparent 70%)', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: '-30px', left: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)', borderRadius: '50%' }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                  {/* Animated checkmark with glow */}
                  <div style={{ width: '72px', height: '72px', background: 'linear-gradient(135deg, #34d399, #10b981)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 12px 32px rgba(16,185,129,0.35), 0 0 0 6px rgba(255,255,255,0.15)', animation: 'successPopIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.2s both' }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>

                  <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.3, margin: '0 0 6px' }}>
                    {sc.title}
                  </h3>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                    {sc.subtitle}
                  </p>
                </div>
              </div>

              {/* Step progress indicator */}
              <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
                  {/* Lines behind steps */}
                  <div style={{ position: 'absolute', top: '15px', left: '10%', right: '10%', height: '2px', background: '#e2e8f0', zIndex: 0 }} />
                  <div style={{ position: 'absolute', top: '15px', left: '10%', right: '50%', height: '2px', background: 'linear-gradient(to right, #86efac, rgba(22,44,102,0.2))', zIndex: 0 }} />
                  
                  {sc.steps.map((step, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative', zIndex: 1 }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0,
                        ...(i === 0
                          ? { background: '#dcfce7', color: '#16a34a', boxShadow: '0 0 0 4px #fff, 0 0 0 6px #bbf7d0' }
                          : i === 1
                            ? { background: '#162C66', color: '#fff', boxShadow: '0 0 0 4px #fff, 0 4px 12px rgba(22,44,102,0.3)' }
                            : { background: '#f1f5f9', color: '#94a3b8', boxShadow: '0 0 0 4px #fff' }
                        )
                      }}>
                        {i === 0 ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : (
                          i + 1
                        )}
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 600, marginTop: '8px', textAlign: 'center', lineHeight: 1.2, color: i === 0 ? '#16a34a' : i === 1 ? '#162C66' : '#94a3b8' }}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA area */}
              <div style={{ padding: '24px 32px 32px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', fontWeight: 500, color: '#64748b', lineHeight: 1.6, margin: '0 0 20px', maxWidth: '320px', marginLeft: 'auto', marginRight: 'auto' }}>
                  {sc.desc}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSuccessMsg(null);
                    if (successRedirectFn.current) successRedirectFn.current();
                  }}
                  style={{ width: '100%', padding: '14px 24px', background: '#162C66', color: '#fff', fontSize: '14px', fontWeight: 700, borderRadius: '12px', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(22,44,102,0.25)', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#0F1E45'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(22,44,102,0.35)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#162C66'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(22,44,102,0.25)'; }}
                >
                  {sc.cta}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </button>
              </div>
            </div>
            <style>{`
              @keyframes successFadeIn { from { opacity:0 } to { opacity:1 } }
              @keyframes successScaleIn { from { opacity:0; transform:scale(0.92) translateY(10px) } to { opacity:1; transform:scale(1) translateY(0) } }
              @keyframes successPopIn { from { opacity:0; transform:scale(0.4) rotate(-10deg) } to { opacity:1; transform:scale(1) rotate(0deg) } }
            `}</style>
          </div>
        );
      })()}

      {/* Error feedback — premium animated toast */}
      {(errorKey || (reasonBanned && mode === 'login')) ? (
        <div className="mb-5 relative overflow-hidden rounded-2xl border border-red-200/80 bg-gradient-to-r from-red-50 to-red-50/50 px-4 sm:px-5 py-4 shadow-sm shadow-red-100/50" style={{ animation: 'shakeIn 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
          <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-red-400 to-red-500 rounded-l-2xl" />
          <div className="flex items-start gap-3.5 ml-1">
            <div className="w-9 h-9 bg-red-500 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-red-500/25 mt-0.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div className="min-w-0">
              <div className="text-[13px] sm:text-sm font-bold text-red-800">{errorsT('title')}</div>
              <div className="mt-0.5 text-[12px] sm:text-[13px] font-medium text-red-600/90 leading-snug">
                {errorsT(((reasonBanned && mode === 'login') ? 'banned' : errorKey) as any)}
              </div>
            </div>
          </div>
          <style>{`@keyframes shakeIn { 0% { opacity:0; transform:translateX(-6px); } 50% { transform:translateX(3px); } 70% { transform:translateX(-2px); } 100% { opacity:1; transform:translateX(0); } }`}</style>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            {activeFormT('emailLabel') ?? ui.emailLabel} <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            placeholder={activeFormT('emailPlaceholder')}
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              {activeFormT('passwordLabel')} <span className="text-red-500">*</span>
            </label>
            {mode === 'login' && (
              <Link
                href="/auth/forgot-password"
                className="text-xs font-semibold text-[#162C66] hover:text-[#0F1E45] hover:underline transition-colors"
              >
                {ui.forgotPassword}
              </Link>
            )}
          </div>
          <div className="relative">
            <input
              ref={passwordRef}
              type={showPassword ? 'text' : 'password'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={clsx(inputCls, 'pr-11')}
              placeholder={activeFormT('passwordPlaceholder')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {mode === 'register' ? (
          <>
            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                {registerT('confirmPasswordLabel')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={clsx(inputCls, 'pr-11')}
                  placeholder={registerT('confirmPasswordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </>
        ) : null}

        {/* Terms checkbox (register only) */}
        {mode === 'register' && (
          <div className="flex items-start gap-3 pt-1">
            <input
              id="terms"
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#162C66] focus:ring-[#162C66]/20 cursor-pointer"
            />
            <label htmlFor="terms" className="text-[12px] sm:text-xs text-slate-500 leading-snug cursor-pointer select-none">
              {ui.agreeToTerms}
            </label>
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          variant="secondary"
          size="md"
          disabled={!canSubmit}
          className="w-full !h-[46px] sm:!h-12 py-0 rounded-xl font-bold text-[14px] sm:text-[15px] shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ease-out bg-[#162C66] text-white hover:bg-[#0F1E45] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#162C66]/20 disabled:bg-slate-100 disabled:text-slate-400 disabled:hover:bg-slate-100 disabled:hover:translate-y-0 disabled:shadow-none disabled:opacity-100"
        >
          {isSubmitting 
            ? commonT('loading') 
            : (mode === 'login' 
                ? activeFormT('submit') 
                : (role === 'employer' ? ui.createEmployerAccount : ui.createJobProfile)
              )
          }
        </Button>
      </form>

      {/* Social Sign-up/Login – Google only */}
      <div className="mt-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs font-semibold text-slate-400 uppercase">{ui.or}</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
        <button
          type="button"
          onClick={handleGoogleClick}
          disabled={googleLoading || isSubmitting}
          className="w-full flex items-center justify-center gap-3 h-[48px] sm:h-[52px] rounded-xl border border-slate-200 bg-white text-[14px] sm:text-[15px] font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {googleLoading ? (
            <div className="w-5 h-5 border-2 border-slate-300 border-t-[#4285F4] rounded-full animate-spin" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 48 48" className="shrink-0">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
          )}
          {locale === 'de' ? 'Mit Google fortfahren' : locale === 'fr' ? 'Continuer avec Google' : locale === 'it' ? 'Continua con Google' : locale === 'sq' ? 'Vazhdo me Google' : 'Continue with Google'}
        </button>
      </div>

      {/* Google Role Picker Wizard Modal */}
      {showGoogleRolePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => { setShowGoogleRolePicker(false); setPendingGoogleNewAccount(false); isRedirecting.current = false; }}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-[#162C66]/[0.06] rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 48 48" className="shrink-0">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-[#0B1F44] tracking-tight">
                {locale === 'de' ? 'Kontotyp auswählen' : locale === 'fr' ? 'Choisir le type de compte' : locale === 'it' ? 'Scegli il tipo di account' : locale === 'sq' ? 'Zgjidhni llojin e llogarisë' : 'Choose account type'}
              </h3>
              <p className="mt-1.5 text-[13px] text-slate-500 font-medium">
                {locale === 'de' ? 'Wie möchten Sie gjej-pune nutzen?' : locale === 'fr' ? 'Comment souhaitez-vous utiliser gjej-pune ?' : locale === 'it' ? 'Come vuoi usare gjej-pune?' : locale === 'sq' ? 'Si dëshironi të përdorni gjej-pune?' : 'How would you like to use gjej-pune?'}
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => { setGoogleRole('job-seeker'); handleGoogleRoleSelect('job-seeker'); }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 bg-white hover:border-[#162C66] hover:bg-[#162C66]/[0.02] transition-all duration-200 group"
              >
                <div className="w-11 h-11 bg-[#162C66]/[0.06] rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[#162C66]/10 transition-colors">
                  <User size={22} className="text-[#162C66]" />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold text-[#0B1F44]">{ui.jobSeekerTitle}</span>
                  <span className="block text-[12px] text-slate-400 mt-0.5">{ui.jobSeekerDesc}</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setGoogleRole('employer'); handleGoogleRoleSelect('employer'); }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 bg-white hover:border-[#162C66] hover:bg-[#162C66]/[0.02] transition-all duration-200 group"
              >
                <div className="w-11 h-11 bg-[#162C66]/[0.06] rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[#162C66]/10 transition-colors">
                  <Building2 size={22} className="text-[#162C66]" />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold text-[#0B1F44]">{ui.employerTitle}</span>
                  <span className="block text-[12px] text-slate-400 mt-0.5">{ui.employerDesc}</span>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => { setShowGoogleRolePicker(false); setPendingGoogleNewAccount(false); isRedirecting.current = false; }}
              className="mt-4 w-full text-center text-[13px] font-semibold text-slate-400 hover:text-slate-600 transition-colors py-2"
            >
              {locale === 'de' ? 'Abbrechen' : locale === 'fr' ? 'Annuler' : locale === 'it' ? 'Annulla' : locale === 'sq' ? 'Anulo' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {/* Footer links */}
      <div className="mt-6 sm:mt-8 flex items-center justify-center gap-6 text-[12px] sm:text-[13px] font-medium text-slate-400">
        <Link
          href="#"
          className="hover:text-slate-600 transition-colors duration-200"
        >
          {locale === 'de' ? 'Datenschutz' : locale === 'fr' ? 'Confidentialité' : locale === 'it' ? 'Privacy' : locale === 'sq' ? 'Privatësia' : 'Privacy'}
        </Link>
        <Link
          href="#"
          className="hover:text-slate-600 transition-colors duration-200"
        >
          {locale === 'de' ? 'AGB' : locale === 'fr' ? 'Conditions' : locale === 'it' ? 'Termini' : locale === 'sq' ? 'Kushtet' : 'Terms'}
        </Link>
      </div>
    </div>
  );
}

