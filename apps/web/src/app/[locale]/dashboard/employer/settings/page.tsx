'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken, logout, getIsPremium } from '@/lib/auth';
import { getSubscriptionDetails, getInvoices, cancelSubscription, reactivateSubscription, openBillingPortal, formatPrice, type SubscriptionDetails, type InvoiceItem } from '@/lib/stripe';
import { Link } from '@/i18n/routing';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import FeedbackToast from '@/app/[locale]/dashboard/job-seeker/_components/FeedbackToast';
import { clsx } from 'clsx';
import PhoneInput from '@/components/PhoneInput';
import {
  Building2,
  Mail,
  Globe,
  Languages,
  MapPin,
  Phone,
  Lock,
  Eye,
  EyeOff,
  User,
  Trash2,
  AlertTriangle,
  Crown,
  CreditCard,
  CheckCircle2,
  XCircle,
  Calendar,
  Receipt,
  Camera,
  Loader2,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

type SettingsTab = 'profile' | 'security' | 'language' | 'subscription';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const inputCls = 'w-full px-4 py-3 bg-[#F8F9FB] border border-slate-200 rounded-xl text-sm font-medium text-[#0B1F44] placeholder:text-slate-400 focus:ring-2 focus:ring-[#F5C400]/30 focus:border-[#F5C400] focus:bg-white outline-none transition-all';

interface ProfileData {
  displayName: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  bio: string;
}

const loc = {
  de: {
    pageTitle: 'Einstellungen', pageSubtitle: 'Verwalten Sie Ihre Konto- und Unternehmenseinstellungen',
    profileTab: 'Profil', securityTab: 'Sicherheit', languageTab: 'Sprache',
    profileTitle: 'Profil bearbeiten', profileSubtitle: 'Ihre persönlichen Daten und Unternehmensinformationen',
    displayName: 'Anzeigename / Firmenname', email: 'E-Mail-Adresse', phone: 'Telefonnummer',
    location: 'Standort', website: 'Webseite', bio: 'Über uns / Beschreibung',
    displayNamePh: 'Max Mustermann oder Firma GmbH', emailPh: 'name@firma.ch',
    phonePh: '+41 79 123 45 67', locationPh: 'Zürich, Schweiz',
    websitePh: 'https://www.beispiel.ch', bioPh: 'Beschreiben Sie Ihr Unternehmen...',
    save: 'Speichern', saving: 'Wird gespeichert...', saved: 'Änderungen gespeichert!',
    errorSave: 'Fehler beim Speichern', errorLoad: 'Fehler beim Laden',
    securityTitle: 'Passwort ändern', securitySubtitle: 'Schützen Sie Ihr Konto mit einem starken Passwort',
    currentPassword: 'Aktuelles Passwort', newPassword: 'Neues Passwort', confirmPassword: 'Passwort bestätigen',
    currentPasswordPh: 'Aktuelles Passwort eingeben', newPasswordPh: 'Neues Passwort eingeben',
    confirmPasswordPh: 'Neues Passwort bestätigen', changePassword: 'Passwort ändern',
    changingPassword: 'Wird geändert...', passwordChanged: 'Passwort erfolgreich geändert!',
    passwordMismatch: 'Passwörter stimmen nicht überein', wrongPassword: 'Aktuelles Passwort ist falsch',
    passwordTooShort: 'Passwort muss mindestens 6 Zeichen lang sein',
    languageTitle: 'Sprache', languageSubtitle: 'Wählen Sie Ihre bevorzugte Sprache',
    languageLabel: 'Anzeigesprache',
    deleteTitle: 'Konto löschen', deleteSubtitle: 'Diese Aktion kann nicht rückgängig gemacht werden',
    deleteDesc: 'Alle Ihre Daten, Stellenangebote und Nachrichten werden unwiderruflich gelöscht.',
    deleteBtn: 'Konto endgültig löschen', deletePasswordPh: 'Passwort zur Bestätigung',
    deleteConfirm: 'Sind Sie sicher? Geben Sie Ihr Passwort ein um fortzufahren.',
    deleting: 'Wird gelöscht...',
    subTab: 'Abonnement', subTitle: 'Ihr Premium-Abonnement', subSubtitle: 'Verwalten Sie Ihren Plan, Rechnungen und Kündigung',
    subActive: 'Aktiv', subInactive: 'Kein aktives Abo', subPlan: 'Aktueller Plan', subPlanName: 'Premium',
    subPrice: 'CHF 39 / Monat', subSince: 'Mitglied seit', subNextBilling: 'Nächste Abrechnung',
    subCancel: 'Abo kündigen', subCancelDesc: 'Ihr Zugang bleibt bis zum Ende der Abrechnungsperiode aktiv.',
    subReactivate: 'Abo reaktivieren', subUpgrade: 'Premium aktivieren',
    subBillingTitle: 'Rechnungshistorie', subNoBills: 'Noch keine Rechnungen vorhanden.',
    subPayment: 'Zahlungsmethode', subNoPayment: 'Noch keine Zahlungsmethode hinterlegt.',
    subManagePayment: 'Zahlungsmethode verwalten',
  },
  en: {
    pageTitle: 'Settings', pageSubtitle: 'Manage your account and company settings',
    profileTab: 'Profile', securityTab: 'Security', languageTab: 'Language',
    profileTitle: 'Edit Profile', profileSubtitle: 'Your personal and company information',
    displayName: 'Display Name / Company Name', email: 'Email Address', phone: 'Phone Number',
    location: 'Location', website: 'Website', bio: 'About / Description',
    displayNamePh: 'John Doe or Company Ltd', emailPh: 'name@company.com',
    phonePh: '+1 555 123 4567', locationPh: 'New York, USA',
    websitePh: 'https://www.example.com', bioPh: 'Describe your company...',
    save: 'Save', saving: 'Saving...', saved: 'Changes saved!',
    errorSave: 'Error saving changes', errorLoad: 'Error loading profile',
    securityTitle: 'Change Password', securitySubtitle: 'Protect your account with a strong password',
    currentPassword: 'Current Password', newPassword: 'New Password', confirmPassword: 'Confirm Password',
    currentPasswordPh: 'Enter current password', newPasswordPh: 'Enter new password',
    confirmPasswordPh: 'Confirm new password', changePassword: 'Change Password',
    changingPassword: 'Changing...', passwordChanged: 'Password changed successfully!',
    passwordMismatch: 'Passwords do not match', wrongPassword: 'Current password is incorrect',
    passwordTooShort: 'Password must be at least 6 characters',
    languageTitle: 'Language', languageSubtitle: 'Choose your preferred language',
    languageLabel: 'Display Language',
    deleteTitle: 'Delete Account', deleteSubtitle: 'This action cannot be undone',
    deleteDesc: 'All your data, job listings and messages will be permanently deleted.',
    deleteBtn: 'Delete Account Permanently', deletePasswordPh: 'Password to confirm',
    deleteConfirm: 'Are you sure? Enter your password to continue.',
    deleting: 'Deleting...',
    subTab: 'Subscription', subTitle: 'Your Premium Subscription', subSubtitle: 'Manage your plan, billing and cancellation',
    subActive: 'Active', subInactive: 'No active subscription', subPlan: 'Current Plan', subPlanName: 'Premium',
    subPrice: 'CHF 39 / month', subSince: 'Member since', subNextBilling: 'Next billing',
    subCancel: 'Cancel subscription', subCancelDesc: 'Your access remains active until the end of the billing period.',
    subReactivate: 'Reactivate subscription', subUpgrade: 'Activate Premium',
    subBillingTitle: 'Billing History', subNoBills: 'No invoices yet.',
    subPayment: 'Payment Method', subNoPayment: 'No payment method on file.',
    subManagePayment: 'Manage payment method',
  },
  fr: {
    pageTitle: 'Paramètres', pageSubtitle: 'Gérez les paramètres de votre compte et entreprise',
    profileTab: 'Profil', securityTab: 'Sécurité', languageTab: 'Langue',
    profileTitle: 'Modifier le profil', profileSubtitle: 'Vos informations personnelles et d\'entreprise',
    displayName: 'Nom / Nom de l\'entreprise', email: 'Adresse e-mail', phone: 'Numéro de téléphone',
    location: 'Lieu', website: 'Site web', bio: 'À propos / Description',
    displayNamePh: 'Jean Dupont ou Entreprise SA', emailPh: 'nom@entreprise.fr',
    phonePh: '+33 6 12 34 56 78', locationPh: 'Paris, France',
    websitePh: 'https://www.exemple.fr', bioPh: 'Décrivez votre entreprise...',
    save: 'Enregistrer', saving: 'Enregistrement...', saved: 'Modifications enregistrées !',
    errorSave: 'Erreur lors de l\'enregistrement', errorLoad: 'Erreur de chargement',
    securityTitle: 'Changer le mot de passe', securitySubtitle: 'Protégez votre compte avec un mot de passe fort',
    currentPassword: 'Mot de passe actuel', newPassword: 'Nouveau mot de passe', confirmPassword: 'Confirmer',
    currentPasswordPh: 'Entrez le mot de passe actuel', newPasswordPh: 'Entrez le nouveau mot de passe',
    confirmPasswordPh: 'Confirmez le nouveau mot de passe', changePassword: 'Changer le mot de passe',
    changingPassword: 'Modification...', passwordChanged: 'Mot de passe modifié !',
    passwordMismatch: 'Les mots de passe ne correspondent pas', wrongPassword: 'Mot de passe actuel incorrect',
    passwordTooShort: 'Le mot de passe doit contenir au moins 6 caractères',
    languageTitle: 'Langue', languageSubtitle: 'Choisissez votre langue préférée',
    languageLabel: 'Langue d\'affichage',
    deleteTitle: 'Supprimer le compte', deleteSubtitle: 'Cette action est irréversible',
    deleteDesc: 'Toutes vos données, offres d\'emploi et messages seront supprimés définitivement.',
    deleteBtn: 'Supprimer définitivement', deletePasswordPh: 'Mot de passe pour confirmer',
    deleteConfirm: 'Êtes-vous sûr ? Entrez votre mot de passe pour continuer.',
    deleting: 'Suppression...',
    subTab: 'Abonnement', subTitle: 'Votre abonnement Premium', subSubtitle: 'Gérez votre plan, facturation et résiliation',
    subActive: 'Actif', subInactive: 'Aucun abonnement actif', subPlan: 'Plan actuel', subPlanName: 'Premium',
    subPrice: 'CHF 39 / mois', subSince: 'Membre depuis', subNextBilling: 'Prochaine facturation',
    subCancel: 'Résilier l\'abonnement', subCancelDesc: 'Votre accès reste actif jusqu\'à la fin de la période de facturation.',
    subReactivate: 'Réactiver l\'abonnement', subUpgrade: 'Activer Premium',
    subBillingTitle: 'Historique de facturation', subNoBills: 'Aucune facture pour le moment.',
    subPayment: 'Moyen de paiement', subNoPayment: 'Aucun moyen de paiement enregistré.',
    subManagePayment: 'Gérer le moyen de paiement',
  },
  it: {
    pageTitle: 'Impostazioni', pageSubtitle: 'Gestisci le impostazioni del tuo account e azienda',
    profileTab: 'Profilo', securityTab: 'Sicurezza', languageTab: 'Lingua',
    profileTitle: 'Modifica profilo', profileSubtitle: 'Le tue informazioni personali e aziendali',
    displayName: 'Nome / Nome azienda', email: 'Indirizzo email', phone: 'Numero di telefono',
    location: 'Luogo', website: 'Sito web', bio: 'Chi siamo / Descrizione',
    displayNamePh: 'Mario Rossi o Azienda Srl', emailPh: 'nome@azienda.it',
    phonePh: '+39 333 123 4567', locationPh: 'Milano, Italia',
    websitePh: 'https://www.esempio.it', bioPh: 'Descrivi la tua azienda...',
    save: 'Salva', saving: 'Salvataggio...', saved: 'Modifiche salvate!',
    errorSave: 'Errore nel salvataggio', errorLoad: 'Errore nel caricamento',
    securityTitle: 'Cambia password', securitySubtitle: 'Proteggi il tuo account con una password forte',
    currentPassword: 'Password attuale', newPassword: 'Nuova password', confirmPassword: 'Conferma password',
    currentPasswordPh: 'Inserisci password attuale', newPasswordPh: 'Inserisci nuova password',
    confirmPasswordPh: 'Conferma nuova password', changePassword: 'Cambia password',
    changingPassword: 'Modifica...', passwordChanged: 'Password modificata!',
    passwordMismatch: 'Le password non corrispondono', wrongPassword: 'Password attuale errata',
    passwordTooShort: 'La password deve contenere almeno 6 caratteri',
    languageTitle: 'Lingua', languageSubtitle: 'Scegli la tua lingua preferita',
    languageLabel: 'Lingua di visualizzazione',
    deleteTitle: 'Elimina account', deleteSubtitle: 'Questa azione non può essere annullata',
    deleteDesc: 'Tutti i tuoi dati, offerte di lavoro e messaggi saranno eliminati definitivamente.',
    deleteBtn: 'Elimina account definitivamente', deletePasswordPh: 'Password per confermare',
    deleteConfirm: 'Sei sicuro? Inserisci la tua password per continuare.',
    deleting: 'Eliminazione...',
    subTab: 'Abbonamento', subTitle: 'Il tuo abbonamento Premium', subSubtitle: 'Gestisci piano, fatturazione e cancellazione',
    subActive: 'Attivo', subInactive: 'Nessun abbonamento attivo', subPlan: 'Piano attuale', subPlanName: 'Premium',
    subPrice: 'CHF 39 / mese', subSince: 'Membro dal', subNextBilling: 'Prossima fatturazione',
    subCancel: 'Annulla abbonamento', subCancelDesc: 'Il tuo accesso resta attivo fino alla fine del periodo di fatturazione.',
    subReactivate: 'Riattiva abbonamento', subUpgrade: 'Attiva Premium',
    subBillingTitle: 'Cronologia fatturazione', subNoBills: 'Nessuna fattura ancora.',
    subPayment: 'Metodo di pagamento', subNoPayment: 'Nessun metodo di pagamento registrato.',
    subManagePayment: 'Gestisci metodo di pagamento',
  },
  sq: {
    pageTitle: 'Cilësimet', pageSubtitle: 'Menaxhoni cilësimet e llogarisë dhe kompanisë tuaj',
    profileTab: 'Profili', securityTab: 'Siguria', languageTab: 'Gjuha',
    profileTitle: 'Ndrysho profilin', profileSubtitle: 'Informacionet tuaja personale dhe të kompanisë',
    displayName: 'Emri / Emri i kompanisë', email: 'Adresa e emailit', phone: 'Numri i telefonit',
    location: 'Vendndodhja', website: 'Faqja e internetit', bio: 'Rreth nesh / Përshkrimi',
    displayNamePh: 'Filan Fisteku ose Kompania SH.P.K', emailPh: 'emri@kompania.al',
    phonePh: '+355 69 123 4567', locationPh: 'Tiranë, Shqipëri',
    websitePh: 'https://www.shembull.al', bioPh: 'Përshkruani kompaninë tuaj...',
    save: 'Ruaj', saving: 'Duke ruajtur...', saved: 'Ndryshimet u ruajtën!',
    errorSave: 'Gabim gjatë ruajtjes', errorLoad: 'Gabim gjatë ngarkimit',
    securityTitle: 'Ndrysho fjalëkalimin', securitySubtitle: 'Mbroni llogarinë tuaj me një fjalëkalim të fortë',
    currentPassword: 'Fjalëkalimi aktual', newPassword: 'Fjalëkalimi i ri', confirmPassword: 'Konfirmo fjalëkalimin',
    currentPasswordPh: 'Vendosni fjalëkalimin aktual', newPasswordPh: 'Vendosni fjalëkalimin e ri',
    confirmPasswordPh: 'Konfirmoni fjalëkalimin e ri', changePassword: 'Ndrysho fjalëkalimin',
    changingPassword: 'Duke ndryshuar...', passwordChanged: 'Fjalëkalimi u ndryshua!',
    passwordMismatch: 'Fjalëkalimet nuk përputhen', wrongPassword: 'Fjalëkalimi aktual është i gabuar',
    passwordTooShort: 'Fjalëkalimi duhet të ketë të paktën 6 karaktere',
    languageTitle: 'Gjuha', languageSubtitle: 'Zgjidhni gjuhën tuaj të preferuar',
    languageLabel: 'Gjuha e shfaqjes',
    deleteTitle: 'Fshi llogarinë', deleteSubtitle: 'Ky veprim nuk mund të kthehet',
    deleteDesc: 'Të gjitha të dhënat tuaja, ofertat e punës dhe mesazhet do të fshihen përgjithmonë.',
    deleteBtn: 'Fshi llogarinë përgjithmonë', deletePasswordPh: 'Fjalëkalimi për konfirmim',
    deleteConfirm: 'Jeni të sigurt? Vendosni fjalëkalimin tuaj për të vazhduar.',
    deleting: 'Duke fshirë...',
    subTab: 'Abonimi', subTitle: 'Abonimi juaj Premium', subSubtitle: 'Menaxhoni planin, faturat dhe anulimin',
    subActive: 'Aktiv', subInactive: 'Asnjë abonim aktiv', subPlan: 'Plani aktual', subPlanName: 'Premium',
    subPrice: 'CHF 39 / muaj', subSince: 'Anëtar që nga', subNextBilling: 'Faturimi i ardhshëm',
    subCancel: 'Anulo abonimin', subCancelDesc: 'Qasja juaj mbetet aktive deri në fund të periudhës së faturimit.',
    subReactivate: 'Riaktivizo abonimin', subUpgrade: 'Aktivizo Premium',
    subBillingTitle: 'Historia e faturimit', subNoBills: 'Ende asnjë faturë.',
    subPayment: 'Metoda e pagesës', subNoPayment: 'Asnjë metodë pagese e regjistruar.',
    subManagePayment: 'Menaxho metodën e pagesës',
  },
} as const;

export default function EmployerSettingsPage() {
  const locale = useLocale() as keyof typeof loc;
  const t = loc[locale] ?? loc.de;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab = (searchParams.get('tab') as SettingsTab) || 'profile';
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Profile state
  const [profile, setProfile] = useState<ProfileData>({
    displayName: '', email: '', phone: '', location: '', website: '', bio: '',
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Subscription state
  const [isPremium, setIsPremium] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [sub, setSub] = useState<SubscriptionDetails | null>(null);
  const [invoiceList, setInvoiceList] = useState<InvoiceItem[]>([]);
  const [showSubCancelConfirm, setShowSubCancelConfirm] = useState(false);

  // Load premium status & subscription
  useEffect(() => {
    setIsPremium(getIsPremium());
    getSubscriptionDetails().then(s => {
      setSub(s);
      if (s?.active) setIsPremium(true);
    });
    getInvoices().then(setInvoiceList);
  }, []);

  // Load profile on mount
  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    api.get<{ ok: boolean; profile: any }>('/api/settings/profile', token)
      .then((res) => {
        if (res.ok && res.profile) {
          setProfile({
            displayName: res.profile.displayName || '',
            email: res.profile.email || '',
            phone: res.profile.phone || '',
            location: res.profile.location || '',
            website: res.profile.website || '',
            bio: res.profile.bio || '',
          });
          if (res.profile.image) setProfileImage(res.profile.image);
        }
      })
      .catch(() => setToast(t.errorLoad))
      .finally(() => setLoading(false));
  }, []);

  const handleImageUpload = async (file: File) => {
    const token = getToken();
    if (!token) return;
    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.upload<{ ok: boolean; image: string }>('/api/settings/profile-image', fd, token);
      if (res.ok) {
        setProfileImage(res.image);
        setToast(t.saved);
        window.dispatchEvent(new Event('profile:imageUpdated'));
      }
    } catch {
      setToast(t.errorSave);
    }
    setImageUploading(false);
  };

  const handleSaveProfile = async () => {
    const token = getToken();
    if (!token) return;
    setIsSaving(true);
    try {
      const res = await api.put<{ ok: boolean; error?: string }>('/api/settings/profile', profile, token);
      if (res.ok) {
        setToast(t.saved);
      } else {
        setToast(t.errorSave);
      }
    } catch {
      setToast(t.errorSave);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwError(null);
    if (newPassword !== confirmPw) { setPwError(t.passwordMismatch); return; }
    if (newPassword.length < 6) { setPwError(t.passwordTooShort); return; }

    const token = getToken();
    if (!token) return;
    setIsChangingPw(true);
    try {
      const res = await api.put<{ ok: boolean; error?: string }>('/api/settings/password', {
        currentPassword, newPassword,
      }, token);
      if (res.ok) {
        setToast(t.passwordChanged);
        setCurrentPassword(''); setNewPassword(''); setConfirmPw('');
      } else {
        setPwError(res.error === 'wrongPassword' ? t.wrongPassword : t.passwordTooShort);
      }
    } catch {
      setPwError(t.errorSave);
    } finally {
      setIsChangingPw(false);
    }
  };

  const handleDeleteAccount = async () => {
    const token = getToken();
    if (!token || !deletePassword) return;
    setIsDeleting(true);
    try {
      const res = await api.post<{ ok: boolean; error?: string }>('/api/settings/delete-account', {
        password: deletePassword,
      }, token);
      if (res.ok) {
        await logout();
        window.location.href = `/${locale}/auth/login`;
      } else {
        setPwError(res.error === 'wrongPassword' ? t.wrongPassword : t.errorSave);
        setIsDeleting(false);
      }
    } catch {
      setPwError(t.errorSave);
      setIsDeleting(false);
    }
  };

  const handleCancelSub = async () => {
    setSubLoading(true);
    const result = await cancelSubscription();
    setSubLoading(false);
    setShowSubCancelConfirm(false);
    if (result.ok) {
      setToast(t.subCancel + '!');
      getSubscriptionDetails().then(setSub);
    } else {
      setToast('Error: ' + result.error);
    }
  };

  const handleReactivateSub = async () => {
    setSubLoading(true);
    const result = await reactivateSubscription();
    setSubLoading(false);
    if (result.ok) {
      setToast(t.subActive + '!');
      getSubscriptionDetails().then(setSub);
    } else {
      setToast('Error: ' + result.error);
    }
  };

  const tabs: { key: SettingsTab; label: string; icon: typeof Building2 }[] = [
    { key: 'profile', label: t.profileTab, icon: User },
    { key: 'subscription', label: t.subTab, icon: Crown },
    { key: 'security', label: t.securityTab, icon: Lock },
    { key: 'language', label: t.languageTab, icon: Languages },
  ];

  const updateField = (key: keyof ProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-8">
      <FeedbackToast message={toast} onDismiss={() => setToast(null)} />

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B1F44] tracking-tight">{t.pageTitle}</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">{t.pageSubtitle}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Side tabs */}
        <div className="w-[260px] shrink-0 hidden lg:block">
          <div className="sticky top-24 bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-3">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold transition-all text-left',
                      isActive
                        ? 'bg-[#0B1F44] text-white shadow-sm'
                        : 'text-slate-500 hover:text-[#0B1F44] hover:bg-slate-50'
                    )}
                  >
                    <div className={clsx(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                      isActive ? 'bg-white/15' : 'bg-slate-100'
                    )}>
                      <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                    </div>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Mobile tab select */}
          <div className="lg:hidden">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as SettingsTab)}
              className={inputCls}
            >
              {tabs.map((tab) => (
                <option key={tab.key} value={tab.key}>{tab.label}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <Card className="p-6 animate-pulse">
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i}>
                    <div className="h-4 bg-slate-200 rounded w-1/4 mb-2" />
                    <div className="h-11 bg-slate-100 rounded-xl" />
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <>
              {/* Profile */}
              {activeTab === 'profile' && (
                <div className="space-y-5">
                  {/* Profile Header Card with Image */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
                    <div className="bg-gradient-to-r from-[#0B1F44] to-[#162C66] px-6 py-6 sm:py-8">
                      <div className="flex flex-col sm:flex-row items-center gap-5">
                        <div className="relative group">
                          {profileImage ? (
                            <img src={profileImage.startsWith('/uploads/') ? `${API_URL}${profileImage}` : profileImage} alt="" className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-[3px] border-white/20 shadow-lg" />
                          ) : (
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/10 border-[3px] border-white/20 flex items-center justify-center shadow-lg">
                              <Building2 size={32} className="text-white/40" />
                            </div>
                          )}
                          <label className="absolute inset-0 rounded-2xl flex items-center justify-center cursor-pointer bg-black/0 group-hover:bg-black/50 transition-all">
                            {imageUploading ? (
                              <Loader2 size={22} className="text-white animate-spin" />
                            ) : (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1">
                                <Camera size={20} className="text-white" />
                                <span className="text-[10px] font-bold text-white/80 uppercase tracking-wide">Foto</span>
                              </div>
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); }} />
                          </label>
                        </div>
                        <div className="text-center sm:text-left">
                          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">{profile.displayName || '—'}</h2>
                          <p className="text-[13px] text-white/50 font-medium mt-0.5">{profile.email}</p>
                          {profile.location && (
                            <div className="flex items-center gap-1.5 mt-2 justify-center sm:justify-start">
                              <MapPin size={12} className="text-white/30" />
                              <span className="text-[12px] text-white/40 font-medium">{profile.location}</span>
                            </div>
                          )}
                          <label className="inline-flex items-center gap-1.5 mt-3 px-3.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg cursor-pointer transition-all">
                            <Camera size={13} className="text-white/70" />
                            <span className="text-[12px] font-semibold text-white/70">
                              {{ de: 'Foto ändern', en: 'Change photo', fr: 'Changer la photo', it: 'Cambia foto', sq: 'Ndrysho foton' }[locale] || 'Change photo'}
                            </span>
                            <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); }} />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
                    <div className="px-5 sm:px-6 py-4 border-b border-slate-100">
                      <h3 className="text-[14px] font-bold text-[#0B1F44]">{t.profileTitle}</h3>
                      <p className="text-[12px] text-slate-400 font-medium mt-0.5">{t.profileSubtitle}</p>
                    </div>
                    <div className="px-5 sm:px-6 py-5 sm:py-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <label className="block">
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                            <User size={11} />{t.displayName}
                          </span>
                          <input
                            className={inputCls}
                            value={profile.displayName}
                            onChange={(e) => updateField('displayName', e.target.value)}
                            placeholder={t.displayNamePh}
                          />
                        </label>
                        <label className="block">
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                            <Mail size={11} />{t.email}
                          </span>
                          <input
                            type="email"
                            className={inputCls}
                            value={profile.email}
                            onChange={(e) => updateField('email', e.target.value)}
                            placeholder={t.emailPh}
                          />
                        </label>
                        <div className="block" onClick={(e) => {
                          const el = e.currentTarget;
                          setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
                        }}>
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                            <Phone size={11} />{t.phone}
                          </span>
                          <PhoneInput
                            value={profile.phone}
                            onChange={(val) => updateField('phone', val)}
                            placeholder={t.phonePh}
                            className={inputCls}
                          />
                        </div>
                        <label className="block">
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                            <MapPin size={11} />{t.location}
                          </span>
                          <input
                            className={inputCls}
                            value={profile.location}
                            onChange={(e) => updateField('location', e.target.value)}
                            placeholder={t.locationPh}
                          />
                        </label>
                        <label className="block">
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                            <Globe size={11} />{t.website}
                          </span>
                          <input
                            className={inputCls}
                            value={profile.website}
                            onChange={(e) => updateField('website', e.target.value)}
                            placeholder={t.websitePh}
                          />
                        </label>
                        <label className="block md:col-span-2">
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                            <Building2 size={11} />{t.bio}
                          </span>
                          <textarea
                            rows={4}
                            className={clsx(inputCls, 'resize-none')}
                            value={profile.bio}
                            onChange={(e) => updateField('bio', e.target.value)}
                            placeholder={t.bioPh}
                          />
                        </label>
                      </div>

                      <div className="mt-6 pt-5 border-t border-slate-100 flex justify-end">
                        <button
                          type="button"
                          onClick={handleSaveProfile}
                          disabled={isSaving}
                          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0B1F44] text-white rounded-xl text-[13px] font-bold hover:bg-[#162C66] disabled:opacity-50 transition-all shadow-sm"
                        >
                          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                          {isSaving ? t.saving : t.save}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security */}
              {activeTab === 'security' && (
                <>
                  <Card variant="elevated" className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-5 sm:mb-6 pb-4 border-b border-slate-100">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#0B1F44]/[0.06] rounded-lg flex items-center justify-center shrink-0">
                        <Lock size={16} className="text-[#0B1F44] sm:w-[18px] sm:h-[18px]" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-[#0B1F44]">{t.securityTitle}</h2>
                        <p className="text-sm text-slate-400 font-medium">{t.securitySubtitle}</p>
                      </div>
                    </div>

                    {pwError && (
                      <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                        <p className="text-sm font-semibold text-red-700">{pwError}</p>
                      </div>
                    )}

                    <div className="space-y-5 max-w-lg">
                      <label className="block">
                        <span className="block text-sm font-medium text-slate-600 mb-1.5">{t.currentPassword}</span>
                        <div className="relative">
                          <input
                            type={showCurrentPw ? 'text' : 'password'}
                            className={inputCls}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder={t.currentPasswordPh}
                          />
                          <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <label className="block">
                          <span className="block text-sm font-medium text-slate-600 mb-1.5">{t.newPassword}</span>
                          <input
                            type="password"
                            className={inputCls}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder={t.newPasswordPh}
                          />
                        </label>
                        <label className="block">
                          <span className="block text-sm font-medium text-slate-600 mb-1.5">{t.confirmPassword}</span>
                          <input
                            type="password"
                            className={inputCls}
                            value={confirmPw}
                            onChange={(e) => setConfirmPw(e.target.value)}
                            placeholder={t.confirmPasswordPh}
                          />
                        </label>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleChangePassword}
                        disabled={isChangingPw || !currentPassword || !newPassword || !confirmPw}
                      >
                        {isChangingPw ? t.changingPassword : t.changePassword}
                      </Button>
                    </div>
                  </Card>

                  {/* Delete Account */}
                  <Card variant="elevated" className="p-4 sm:p-6 border-red-200/60">
                    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-red-100">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                        <Trash2 size={16} className="text-red-500" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-red-700">{t.deleteTitle}</h2>
                        <p className="text-sm text-red-400 font-medium">{t.deleteSubtitle}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">{t.deleteDesc}</p>

                    {!showDeleteConfirm ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="!border-red-200 !text-red-600 hover:!bg-red-50"
                        onClick={() => setShowDeleteConfirm(true)}
                      >
                        <Trash2 size={14} />
                        {t.deleteBtn}
                      </Button>
                    ) : (
                      <div className="space-y-3 max-w-sm">
                        <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
                          <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                          <p className="text-[12px] font-medium text-amber-700">{t.deleteConfirm}</p>
                        </div>
                        <input
                          type="password"
                          className={inputCls}
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          placeholder={t.deletePasswordPh}
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="!border-red-300 !bg-red-600 !text-white hover:!bg-red-700"
                            onClick={handleDeleteAccount}
                            disabled={isDeleting || !deletePassword}
                          >
                            {isDeleting ? t.deleting : t.deleteBtn}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); }}
                          >
                            {locale === 'de' ? 'Abbrechen' : locale === 'fr' ? 'Annuler' : locale === 'it' ? 'Annulla' : locale === 'sq' ? 'Anulo' : 'Cancel'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                </>
              )}

              {/* Subscription */}
              {activeTab === 'subscription' && (
                <div className="space-y-4 sm:space-y-5">
                  {/* Plan Info */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
                    <div className="px-5 sm:px-6 py-5 border-b border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-[#F5C400]/10 rounded-lg flex items-center justify-center">
                            <Crown size={15} className="text-[#F5C400]" />
                          </div>
                          <div>
                            <h2 className="text-base font-bold text-[#0B1F44]">{t.subTitle}</h2>
                            <p className="text-[12px] sm:text-[13px] text-slate-500 mt-0.5">{t.subSubtitle}</p>
                          </div>
                        </div>
                        <span className={clsx(
                          'px-3 py-1 rounded-full text-xs font-bold',
                          isPremium && sub?.active ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                        )}>
                          {isPremium && sub?.active ? t.subActive : t.subInactive}
                        </span>
                      </div>
                    </div>

                    <div className="px-5 sm:px-6 py-5 sm:py-6">
                      {isPremium && sub?.active ? (
                        <div className="space-y-5">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-slate-50 rounded-xl p-4">
                              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{t.subPlan}</p>
                              <div className="flex items-center gap-2">
                                <Crown size={16} className="text-[#F5C400]" />
                                <span className="text-sm font-bold text-[#0B1F44]">Premium {sub.planMonths} {sub.planMonths === 1 ? 'Mo' : 'Mo.'}</span>
                              </div>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4">
                              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{t.subSince}</p>
                              <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-slate-400" />
                                <span className="text-sm font-bold text-[#0B1F44]">{new Date(sub.currentPeriodStart).toLocaleDateString(locale)}</span>
                              </div>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4">
                              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{t.subNextBilling}</p>
                              <div className="flex items-center gap-2">
                                <Receipt size={16} className="text-slate-400" />
                                <span className="text-sm font-bold text-[#0B1F44]">
                                  {sub.cancelAtPeriodEnd ? '—' : `${formatPrice(sub.amountCents, sub.currency)} · ${new Date(sub.currentPeriodEnd).toLocaleDateString(locale)}`}
                                </span>
                              </div>
                            </div>
                          </div>

                          {sub.cancelAtPeriodEnd ? (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                              <p className="text-sm font-semibold text-amber-800 flex-1">
                                {t.subCancelDesc} ({new Date(sub.currentPeriodEnd).toLocaleDateString(locale)})
                              </p>
                              <button
                                type="button"
                                onClick={handleReactivateSub}
                                disabled={subLoading}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#162C66] bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50"
                              >
                                {subLoading ? '...' : t.subReactivate}
                              </button>
                            </div>
                          ) : (
                            <div className="pt-2 border-t border-slate-100">
                              {showSubCancelConfirm ? (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                  <p className="text-sm font-semibold text-red-700 flex-1">{t.subCancelDesc}</p>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={handleCancelSub}
                                      disabled={subLoading}
                                      className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-all disabled:opacity-50"
                                    >
                                      {subLoading ? '...' : t.subCancel}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setShowSubCancelConfirm(false)}
                                      className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setShowSubCancelConfirm(true)}
                                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-all"
                                >
                                  <XCircle size={15} />
                                  {t.subCancel}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center py-6">
                          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                            <Crown size={24} className="text-slate-300" />
                          </div>
                          <p className="text-sm font-semibold text-slate-500 mb-4">{t.subInactive}</p>
                          <Link
                            href="/dashboard/employer/premium"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#F5C400] to-[#FFD740] text-[#162C66] font-bold text-sm rounded-xl shadow-lg shadow-[#F5C400]/20 hover:shadow-xl hover:scale-[1.01] transition-all"
                          >
                            <Crown size={16} />
                            {t.subUpgrade}
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
                    <div className="px-5 sm:px-6 py-4 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <CreditCard size={15} className="text-[#0B1F44]" />
                        <h2 className="text-base font-bold text-[#0B1F44]">{t.subPayment}</h2>
                      </div>
                    </div>
                    <div className="px-5 sm:px-6 py-4">
                      {sub?.paymentMethod ? (
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                            <span className="text-sm font-semibold text-[#0B1F44] capitalize">{sub.paymentMethod.brand}</span>
                            <span className="text-sm text-slate-500">•••• {sub.paymentMethod.last4}</span>
                            <span className="text-xs text-slate-400 ml-1">{String(sub.paymentMethod.expMonth).padStart(2, '0')}/{sub.paymentMethod.expYear}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => openBillingPortal(locale)}
                            className="ml-auto text-xs font-semibold text-[#162C66] hover:underline"
                          >
                            {t.subManagePayment}
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">{t.subNoPayment}</p>
                      )}
                    </div>
                  </div>

                  {/* Billing History */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
                    <div className="px-5 sm:px-6 py-4 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <Receipt size={15} className="text-[#0B1F44]" />
                        <h2 className="text-base font-bold text-[#0B1F44]">{t.subBillingTitle}</h2>
                      </div>
                    </div>
                    <div className="px-5 sm:px-6 py-4">
                      {invoiceList.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                          {invoiceList.map(inv => (
                            <div key={inv.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                                  <Receipt size={14} className="text-slate-400" />
                                </div>
                                <div className="min-w-0">
                                  <span className="text-sm font-semibold text-[#0B1F44]">{formatPrice(inv.amountCents, inv.currency)}</span>
                                  <p className="text-xs text-slate-400">{new Date(inv.date).toLocaleDateString(locale)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={clsx('text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide',
                                  inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                )}>{inv.status === 'paid' ? (locale === 'de' ? 'Bezahlt' : 'Paid') : inv.status}</span>
                                {inv.pdfUrl && (
                                  <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#162C66] hover:underline">PDF</a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">{t.subNoBills}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Language */}
              {activeTab === 'language' && (
                <Card variant="elevated" className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-5 sm:mb-6 pb-4 border-b border-slate-100">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#0B1F44]/[0.06] rounded-lg flex items-center justify-center shrink-0">
                      <Languages size={16} className="text-[#0B1F44] sm:w-[18px] sm:h-[18px]" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#0B1F44]">{t.languageTitle}</h2>
                      <p className="text-sm text-slate-400 font-medium">{t.languageSubtitle}</p>
                    </div>
                  </div>
                  <label className="block max-w-sm">
                    <span className="block text-sm font-medium text-slate-600 mb-1.5">{t.languageLabel}</span>
                    <select
                      value={locale}
                      onChange={(e) => {
                        const newLocale = e.target.value as 'de' | 'en' | 'fr' | 'it' | 'sq';
                        if (newLocale !== locale) router.replace(pathname, { locale: newLocale });
                      }}
                      className={clsx(inputCls, 'appearance-none')}
                    >
                      <option value="de">Deutsch (DE)</option>
                      <option value="en">English (EN)</option>
                      <option value="fr">Français (FR)</option>
                      <option value="it">Italiano (IT)</option>
                      <option value="sq">Shqip (SQ)</option>
                    </select>
                  </label>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
