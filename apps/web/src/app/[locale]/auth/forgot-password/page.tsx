'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const ui = {
  de: {
    title: 'Passwort vergessen?',
    subtitle: 'Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen.',
    emailLabel: 'E-Mail-Adresse',
    emailPlaceholder: 'name@beispiel.de',
    submit: 'Link senden',
    sending: 'Wird gesendet…',
    successTitle: 'E-Mail gesendet!',
    successDesc: 'Falls ein Konto mit dieser E-Mail existiert, haben wir Ihnen einen Link zum Zurücksetzen des Passworts gesendet. Prüfen Sie Ihren Posteingang.',
    backToLogin: 'Zurück zum Login',
    errorGeneric: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.',
  },
  en: {
    title: 'Forgot password?',
    subtitle: 'Enter your email address and we\'ll send you a reset link.',
    emailLabel: 'Email address',
    emailPlaceholder: 'name@example.com',
    submit: 'Send reset link',
    sending: 'Sending…',
    successTitle: 'Email sent!',
    successDesc: 'If an account with that email exists, we\'ve sent you a password reset link. Check your inbox.',
    backToLogin: 'Back to login',
    errorGeneric: 'Something went wrong. Please try again.',
  },
  fr: {
    title: 'Mot de passe oublié ?',
    subtitle: 'Entrez votre adresse e-mail et nous vous enverrons un lien de réinitialisation.',
    emailLabel: 'Adresse e-mail',
    emailPlaceholder: 'nom@exemple.fr',
    submit: 'Envoyer le lien',
    sending: 'Envoi…',
    successTitle: 'E-mail envoyé !',
    successDesc: 'Si un compte existe avec cet e-mail, nous vous avons envoyé un lien de réinitialisation.',
    backToLogin: 'Retour à la connexion',
    errorGeneric: 'Une erreur s\'est produite. Veuillez réessayer.',
  },
  it: {
    title: 'Password dimenticata?',
    subtitle: 'Inserisci il tuo indirizzo e-mail e ti invieremo un link per reimpostare la password.',
    emailLabel: 'Indirizzo e-mail',
    emailPlaceholder: 'nome@esempio.it',
    submit: 'Invia link',
    sending: 'Invio…',
    successTitle: 'E-mail inviata!',
    successDesc: 'Se esiste un account con quell\'e-mail, ti abbiamo inviato un link per reimpostare la password.',
    backToLogin: 'Torna al login',
    errorGeneric: 'Qualcosa è andato storto. Riprova.',
  },
  sq: {
    title: 'Keni harruar fjalëkalimin?',
    subtitle: 'Shkruani adresën tuaj të emailit dhe do t\'ju dërgojmë një link për rivendosje.',
    emailLabel: 'Adresa e emailit',
    emailPlaceholder: 'emri@shembull.com',
    submit: 'Dërgo linkun',
    sending: 'Duke dërguar…',
    successTitle: 'Emaili u dërgua!',
    successDesc: 'Nëse ekziston një llogari me atë email, ju kemi dërguar një link për rivendosjen e fjalëkalimit.',
    backToLogin: 'Kthehu te hyrja',
    errorGeneric: 'Diçka shkoi keq. Ju lutem provoni përsëri.',
  },
} as const;

export default function ForgotPasswordPage() {
  const locale = useLocale() as keyof typeof ui;
  const t = ui[locale] ?? ui.de;

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (data.ok) {
        setSuccess(true);
      } else {
        setError(t.errorGeneric);
      }
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={32} className="text-emerald-500" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#0B1F44] tracking-tight mb-3">
          {t.successTitle}
        </h1>
        <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-sm mx-auto mb-8">
          {t.successDesc}
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#162C66] text-white text-sm font-bold rounded-xl hover:bg-[#0F1E45] transition-all shadow-md shadow-[#162C66]/15"
        >
          <ArrowLeft size={16} />
          {t.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-[#162C66] transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          {t.backToLogin}
        </Link>
        <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#0B1F44] tracking-tight leading-tight mb-2">
          {t.title}
        </h1>
        <p className="text-sm text-slate-500 font-medium leading-relaxed">
          {t.subtitle}
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-[13px] font-medium text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            {t.emailLabel} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              required
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-[#0B1F44] placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#162C66]/10 focus:border-[#162C66]/30 outline-none transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="w-full py-3.5 bg-[#162C66] text-white text-[15px] font-bold rounded-xl hover:bg-[#0F1E45] transition-all shadow-md shadow-[#162C66]/15 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {t.sending}
            </>
          ) : (
            t.submit
          )}
        </button>
      </form>
    </div>
  );
}
