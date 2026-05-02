'use client';

import { useState, Suspense } from 'react';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Lock, Loader2, CheckCircle2, Eye, EyeOff, AlertCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const ui = {
  de: {
    title: 'Neues Passwort erstellen',
    subtitle: 'Geben Sie Ihr neues Passwort ein.',
    passwordLabel: 'Neues Passwort',
    passwordPlaceholder: 'Mindestens 6 Zeichen',
    confirmLabel: 'Passwort bestätigen',
    confirmPlaceholder: 'Passwort erneut eingeben',
    submit: 'Passwort ändern',
    saving: 'Wird gespeichert…',
    successTitle: 'Passwort geändert!',
    successDesc: 'Ihr Passwort wurde erfolgreich zurückgesetzt. Sie können sich jetzt mit Ihrem neuen Passwort anmelden.',
    goToLogin: 'Zum Login',
    errorMismatch: 'Passwörter stimmen nicht überein.',
    errorTooShort: 'Passwort muss mindestens 6 Zeichen lang sein.',
    errorInvalidToken: 'Der Link ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen an.',
    errorExpired: 'Der Link ist abgelaufen. Bitte fordern Sie einen neuen an.',
    errorGeneric: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.',
    noToken: 'Kein gültiger Token vorhanden.',
    requestNew: 'Neuen Link anfordern',
  },
  en: {
    title: 'Create new password',
    subtitle: 'Enter your new password below.',
    passwordLabel: 'New password',
    passwordPlaceholder: 'At least 6 characters',
    confirmLabel: 'Confirm password',
    confirmPlaceholder: 'Re-enter password',
    submit: 'Reset password',
    saving: 'Saving…',
    successTitle: 'Password changed!',
    successDesc: 'Your password has been successfully reset. You can now log in with your new password.',
    goToLogin: 'Go to login',
    errorMismatch: 'Passwords do not match.',
    errorTooShort: 'Password must be at least 6 characters.',
    errorInvalidToken: 'This link is invalid or expired. Please request a new one.',
    errorExpired: 'This link has expired. Please request a new one.',
    errorGeneric: 'Something went wrong. Please try again.',
    noToken: 'No valid token found.',
    requestNew: 'Request new link',
  },
  fr: {
    title: 'Créer un nouveau mot de passe',
    subtitle: 'Entrez votre nouveau mot de passe ci-dessous.',
    passwordLabel: 'Nouveau mot de passe',
    passwordPlaceholder: 'Au moins 6 caractères',
    confirmLabel: 'Confirmer le mot de passe',
    confirmPlaceholder: 'Saisir à nouveau',
    submit: 'Réinitialiser',
    saving: 'Enregistrement…',
    successTitle: 'Mot de passe changé !',
    successDesc: 'Votre mot de passe a été réinitialisé avec succès.',
    goToLogin: 'Aller à la connexion',
    errorMismatch: 'Les mots de passe ne correspondent pas.',
    errorTooShort: 'Le mot de passe doit contenir au moins 6 caractères.',
    errorInvalidToken: 'Ce lien est invalide ou expiré.',
    errorExpired: 'Ce lien a expiré.',
    errorGeneric: 'Une erreur s\'est produite.',
    noToken: 'Aucun jeton valide trouvé.',
    requestNew: 'Demander un nouveau lien',
  },
  it: {
    title: 'Crea una nuova password',
    subtitle: 'Inserisci la tua nuova password qui sotto.',
    passwordLabel: 'Nuova password',
    passwordPlaceholder: 'Almeno 6 caratteri',
    confirmLabel: 'Conferma password',
    confirmPlaceholder: 'Reinserisci la password',
    submit: 'Reimposta password',
    saving: 'Salvataggio…',
    successTitle: 'Password cambiata!',
    successDesc: 'La tua password è stata reimpostata con successo.',
    goToLogin: 'Vai al login',
    errorMismatch: 'Le password non corrispondono.',
    errorTooShort: 'La password deve contenere almeno 6 caratteri.',
    errorInvalidToken: 'Questo link non è valido o è scaduto.',
    errorExpired: 'Questo link è scaduto.',
    errorGeneric: 'Qualcosa è andato storto.',
    noToken: 'Nessun token valido trovato.',
    requestNew: 'Richiedi un nuovo link',
  },
  sq: {
    title: 'Krijo fjalëkalim të ri',
    subtitle: 'Shkruani fjalëkalimin tuaj të ri më poshtë.',
    passwordLabel: 'Fjalëkalimi i ri',
    passwordPlaceholder: 'Së paku 6 karaktere',
    confirmLabel: 'Konfirmo fjalëkalimin',
    confirmPlaceholder: 'Rishkruani fjalëkalimin',
    submit: 'Rivendos fjalëkalimin',
    saving: 'Duke ruajtur…',
    successTitle: 'Fjalëkalimi u ndryshua!',
    successDesc: 'Fjalëkalimi juaj u rivendos me sukses.',
    goToLogin: 'Shko te hyrja',
    errorMismatch: 'Fjalëkalimet nuk përputhen.',
    errorTooShort: 'Fjalëkalimi duhet të ketë së paku 6 karaktere.',
    errorInvalidToken: 'Ky link është i pavlefshëm ose ka skaduar.',
    errorExpired: 'Ky link ka skaduar.',
    errorGeneric: 'Diçka shkoi keq.',
    noToken: 'Nuk u gjet asnjë token i vlefshëm.',
    requestNew: 'Kërko link të ri',
  },
} as const;

function ResetPasswordForm() {
  const locale = useLocale() as keyof typeof ui;
  const t = ui[locale] ?? ui.de;
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={32} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#0B1F44] tracking-tight mb-3">
          {t.noToken}
        </h1>
        <Link
          href="/auth/forgot-password"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#162C66] text-white text-sm font-bold rounded-xl hover:bg-[#0F1E45] transition-all shadow-md shadow-[#162C66]/15 mt-4"
        >
          {t.requestNew}
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(t.errorTooShort);
      return;
    }
    if (password !== confirmPassword) {
      setError(t.errorMismatch);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (data.ok) {
        setSuccess(true);
      } else {
        if (data.error === 'invalidToken') setError(t.errorInvalidToken);
        else if (data.error === 'tokenExpired') setError(t.errorExpired);
        else if (data.error === 'passwordTooShort') setError(t.errorTooShort);
        else setError(t.errorGeneric);
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
          {t.goToLogin}
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
          {t.goToLogin}
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
            {t.passwordLabel} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.passwordPlaceholder}
              required
              minLength={6}
              className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-[#0B1F44] placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#162C66]/10 focus:border-[#162C66]/30 outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            {t.confirmLabel} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t.confirmPlaceholder}
              required
              minLength={6}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-[#0B1F44] placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#162C66]/10 focus:border-[#162C66]/30 outline-none transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !password || !confirmPassword}
          className="w-full py-3.5 bg-[#162C66] text-white text-[15px] font-bold rounded-xl hover:bg-[#0F1E45] transition-all shadow-md shadow-[#162C66]/15 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {t.saving}
            </>
          ) : (
            t.submit
          )}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
