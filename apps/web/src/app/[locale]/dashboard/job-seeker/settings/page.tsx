'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { logout, getToken, getIsPremium } from '@/lib/auth';
import { getSubscriptionDetails, getInvoices, cancelSubscription, reactivateSubscription, openBillingPortal, formatPrice, type SubscriptionDetails, type InvoiceItem } from '@/lib/stripe';
import { Link } from '@/i18n/routing';
import { api } from '@/lib/api';
import { getJobSeekerConfig } from '@/lib/siteConfig';
import FeedbackToast from '@/app/[locale]/dashboard/job-seeker/_components/FeedbackToast';
import { User, Globe, Bell, Shield, LogOut, Trash2, Lock, Check, Settings, Crown, CreditCard, XCircle, Calendar, Receipt, Camera, Loader2 as Loader2Icon, Mail, Phone, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import PhoneInput from '@/components/PhoneInput';

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type TabKey = 'subscription' | 'language' | 'notifications' | 'security';

const subLoc = {
  de: {
    subTab: 'Abonnement', subTitle: 'Dein Premium-Abonnement', subSubtitle: 'Verwalte deinen Plan, Rechnungen und Kündigung',
    subActive: 'Aktiv', subInactive: 'Kein aktives Abo', subPlan: 'Aktueller Plan', subPlanName: 'Premium',
    subPrice: 'CHF 59 / Monat', subSince: 'Mitglied seit', subNextBilling: 'Nächste Abrechnung',
    subCancel: 'Abo kündigen', subCancelDesc: 'Dein Zugang bleibt bis zum Ende der Abrechnungsperiode aktiv.',
    subUpgrade: 'Premium aktivieren',
    subBillingTitle: 'Rechnungshistorie', subNoBills: 'Noch keine Rechnungen vorhanden.',
    subPayment: 'Zahlungsmethode', subNoPayment: 'Noch keine Zahlungsmethode hinterlegt.',
  },
  en: {
    subTab: 'Subscription', subTitle: 'Your Premium Subscription', subSubtitle: 'Manage your plan, billing and cancellation',
    subActive: 'Active', subInactive: 'No active subscription', subPlan: 'Current Plan', subPlanName: 'Premium',
    subPrice: 'CHF 59 / month', subSince: 'Member since', subNextBilling: 'Next billing',
    subCancel: 'Cancel subscription', subCancelDesc: 'Your access remains active until the end of the billing period.',
    subUpgrade: 'Activate Premium',
    subBillingTitle: 'Billing History', subNoBills: 'No invoices yet.',
    subPayment: 'Payment Method', subNoPayment: 'No payment method on file.',
  },
  fr: {
    subTab: 'Abonnement', subTitle: 'Ton abonnement Premium', subSubtitle: 'Gère ton plan, facturation et résiliation',
    subActive: 'Actif', subInactive: 'Aucun abonnement actif', subPlan: 'Plan actuel', subPlanName: 'Premium',
    subPrice: 'CHF 59 / mois', subSince: 'Membre depuis', subNextBilling: 'Prochaine facturation',
    subCancel: 'Résilier l\'abonnement', subCancelDesc: 'Ton accès reste actif jusqu\'à la fin de la période de facturation.',
    subUpgrade: 'Activer Premium',
    subBillingTitle: 'Historique de facturation', subNoBills: 'Aucune facture pour le moment.',
    subPayment: 'Moyen de paiement', subNoPayment: 'Aucun moyen de paiement enregistré.',
  },
  it: {
    subTab: 'Abbonamento', subTitle: 'Il tuo abbonamento Premium', subSubtitle: 'Gestisci piano, fatturazione e cancellazione',
    subActive: 'Attivo', subInactive: 'Nessun abbonamento attivo', subPlan: 'Piano attuale', subPlanName: 'Premium',
    subPrice: 'CHF 59 / mese', subSince: 'Membro dal', subNextBilling: 'Prossima fatturazione',
    subCancel: 'Annulla abbonamento', subCancelDesc: 'Il tuo accesso resta attivo fino alla fine del periodo di fatturazione.',
    subUpgrade: 'Attiva Premium',
    subBillingTitle: 'Cronologia fatturazione', subNoBills: 'Nessuna fattura ancora.',
    subPayment: 'Metodo di pagamento', subNoPayment: 'Nessun metodo di pagamento registrato.',
  },
  sq: {
    subTab: 'Abonimi', subTitle: 'Abonimi yt Premium', subSubtitle: 'Menaxho planin, faturat dhe anulimin',
    subActive: 'Aktiv', subInactive: 'Asnjë abonim aktiv', subPlan: 'Plani aktual', subPlanName: 'Premium',
    subPrice: 'CHF 59 / muaj', subSince: 'Anëtar që nga', subNextBilling: 'Faturimi i ardhshëm',
    subCancel: 'Anulo abonimin', subCancelDesc: 'Qasja jote mbetet aktive deri në fund të periudhës së faturimit.',
    subUpgrade: 'Aktivizo Premium',
    subBillingTitle: 'Historia e faturimit', subNoBills: 'Ende asnjë faturë.',
    subPayment: 'Metoda e pagesës', subNoPayment: 'Asnjë metodë pagese e regjistruar.',
  },
} as const;

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text'
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[13px] font-semibold text-slate-600 mb-2">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-[14px] font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#162C66]/10 focus:border-[#162C66]/30 outline-none transition-all"
      />
    </label>
  );
}

function Toggle({
  label,
  description,
  enabled,
  onToggle
}: {
  label: string;
  description?: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-[#0B1F44]">{label}</p>
        {description && <p className="text-[12px] sm:text-[13px] text-slate-500 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={clsx(
          'relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#162C66]/20 focus:ring-offset-2',
          enabled ? 'bg-[#162C66]' : 'bg-slate-200'
        )}
        aria-pressed={enabled}
      >
        <span
          className={clsx(
            'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200',
            enabled ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('Settings');
  const feedbackT = useTranslations('jobSeeker.feedback');

  const [activeTab, setActiveTab] = useState<TabKey>('language');

  const [loading, setLoading] = useState(true);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [interviewReminders, setInterviewReminders] = useState(true);
  const [newMessageAlerts, setNewMessageAlerts] = useState(true);

  const [toast, setToast] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isPremium, setIsPremium] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [sub, setSub] = useState<SubscriptionDetails | null>(null);
  const [invoiceList, setInvoiceList] = useState<InvoiceItem[]>([]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const sl = subLoc[locale as keyof typeof subLoc] ?? subLoc.de;

  useEffect(() => {
    setIsPremium(getIsPremium());
    getSubscriptionDetails().then(s => {
      setSub(s);
      if (s?.active) setIsPremium(true);
    });
    getInvoices().then(setInvoiceList);
  }, []);

  const handleCancelSub = async () => {
    setSubLoading(true);
    const result = await cancelSubscription();
    setSubLoading(false);
    setShowCancelConfirm(false);
    if (result.ok) {
      setToast(sl.subCancel + '!');
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
      setToast(sl.subActive + '!');
      getSubscriptionDetails().then(setSub);
    } else {
      setToast('Error: ' + result.error);
    }
  };

  // Load notification settings from backend
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    api.get<{ ok: boolean; profile: { settings: { emailNotifications: boolean; interviewReminders: boolean; newMessageAlerts: boolean } | null } }>('/api/settings/profile', token)
      .then((res) => {
        if (res.ok && res.profile.settings) {
          setEmailNotifications(res.profile.settings.emailNotifications);
          setInterviewReminders(res.profile.settings.interviewReminders);
          setNewMessageAlerts(res.profile.settings.newMessageAlerts);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const onChangePassword = async () => {
    if (isChangingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword) return;
    setIsChangingPassword(true);
    try {
      const token = getToken();
      const res = await api.put<{ ok: boolean; error?: string }>('/api/settings/password', { currentPassword, newPassword }, token || undefined);
      if (res.ok) {
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        setToast(feedbackT('toast.settingsUpdated'));
      } else if (res.error === 'wrongPassword') {
        setToast(t('wrongPassword'));
      } else if (res.error === 'passwordTooShort') {
        setToast(t('passwordTooShort'));
      }
    } catch { setToast('Error'); }
    setIsChangingPassword(false);
  };

  const onToggleNotification = async (key: 'emailNotifications' | 'interviewReminders' | 'newMessageAlerts') => {
    const setters = { emailNotifications: setEmailNotifications, interviewReminders: setInterviewReminders, newMessageAlerts: setNewMessageAlerts };
    const values = { emailNotifications, interviewReminders, newMessageAlerts };
    const newVal = !values[key];
    setters[key](newVal);
    try {
      const token = getToken();
      await api.put('/api/settings/notifications', { [key]: newVal }, token || undefined);
    } catch { setters[key](!newVal); }
  };

  const onDeleteAccount = async () => {
    if (isDeleting || !deletePassword) return;
    setIsDeleting(true);
    try {
      const token = getToken();
      const res = await api.post<{ ok: boolean; error?: string }>('/api/settings/delete-account', { password: deletePassword }, token || undefined);
      if (res.ok) {
        await logout();
        window.location.href = `/${locale}/auth/login`;
      } else if (res.error === 'wrongPassword') {
        setToast(t('wrongPassword'));
      }
    } catch { setToast('Error'); }
    setIsDeleting(false);
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; desc: string }[] = [
    { key: 'language', label: t('language'), icon: <Globe size={18} />, desc: t('languageDesc') },
    { key: 'notifications', label: t('notifications'), icon: <Bell size={18} />, desc: t('notificationsDesc') },
    { key: 'security', label: t('security'), icon: <Shield size={18} />, desc: t('securityDesc') || '' },
  ];

  return (
    <div>
      <FeedbackToast message={toast} onDismiss={() => setToast(null)} />

      {/* Page header */}
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <div className="w-10 h-10 sm:w-11 sm:h-11 bg-slate-100 rounded-xl flex items-center justify-center">
          <Settings size={20} className="text-slate-600" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-[#0B1F44] tracking-tight">{t('title')}</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">{t('subtitle')}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 sm:gap-6">
        {/* Sidebar navigation - Desktop */}
        <nav className="hidden lg:block w-[240px] shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-2 sticky top-[5rem]">
            {tabs.map(({ key, label, icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[13px] font-semibold transition-all text-left mb-0.5 last:mb-0',
                  activeTab === key
                    ? 'bg-[#162C66] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#0B1F44]'
                )}
              >
                <span className={clsx(activeTab === key ? 'text-white/70' : 'text-slate-400')}>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Mobile tab bar */}
        <div className="lg:hidden flex gap-1.5 overflow-x-auto scroll-hint pb-0.5 -mx-1 px-1">
          {tabs.map(({ key, label, icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={clsx(
                'flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[12px] sm:text-[13px] font-semibold transition-all whitespace-nowrap shrink-0',
                activeTab === key
                  ? 'bg-[#162C66] text-white shadow-sm'
                  : 'bg-white text-slate-500 border border-slate-200/60 hover:bg-slate-50 hover:text-slate-700'
              )}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Content panel */}
        <div className="flex-1 min-w-0">
          {/* Language */}
          {activeTab === 'language' && (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="px-5 sm:px-6 py-5 border-b border-slate-100">
                <h2 className="text-base sm:text-lg font-bold text-[#0B1F44]">{t('language')}</h2>
                <p className="text-[12px] sm:text-[13px] text-slate-500 mt-0.5">{t('languageDesc')}</p>
              </div>

              <div className="px-5 sm:px-6 py-5 sm:py-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
                    { code: 'en', label: 'English', flag: '🇬🇧' },
                    { code: 'fr', label: 'Français', flag: '🇫🇷' },
                    { code: 'it', label: 'Italiano', flag: '🇮🇹' },
                    { code: 'sq', label: 'Shqip', flag: '🇦🇱' },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        if (lang.code !== locale) {
                          router.replace(pathname, { locale: lang.code as 'de' | 'en' | 'fr' | 'it' });
                        }
                      }}
                      className={clsx(
                        'flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all',
                        locale === lang.code
                          ? 'border-[#162C66] bg-[#162C66]/[0.03] ring-1 ring-[#162C66]/10'
                          : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
                      )}
                    >
                      <span className="text-xl">{lang.flag}</span>
                      <span className={clsx(
                        'text-[14px] font-semibold',
                        locale === lang.code ? 'text-[#162C66]' : 'text-slate-700'
                      )}>
                        {lang.label}
                      </span>
                      {locale === lang.code && (
                        <Check size={16} className="ml-auto text-[#162C66]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="px-5 sm:px-6 py-5 border-b border-slate-100">
                <h2 className="text-base sm:text-lg font-bold text-[#0B1F44]">{t('notifications')}</h2>
                <p className="text-[12px] sm:text-[13px] text-slate-500 mt-0.5">{t('notificationsDesc')}</p>
              </div>

              <div className="px-5 sm:px-6 divide-y divide-slate-100">
                <Toggle
                  label={t('emailNotifications')}
                  description={t('emailNotificationsDesc')}
                  enabled={emailNotifications}
                  onToggle={() => onToggleNotification('emailNotifications')}
                />
                <Toggle
                  label={t('newMessageAlerts')}
                  description={t('newMessageAlertsDesc')}
                  enabled={newMessageAlerts}
                  onToggle={() => onToggleNotification('newMessageAlerts')}
                />
              </div>
            </div>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <div className="space-y-4 sm:space-y-5">
              {/* Change Password */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="px-5 sm:px-6 py-5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Lock size={15} className="text-slate-500" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#0B1F44]">{t('changePassword')}</h2>
                      <p className="text-[12px] sm:text-[13px] text-slate-500 mt-0.5">{t('changePasswordDesc')}</p>
                    </div>
                  </div>
                </div>

                <div className="px-5 sm:px-6 py-5 sm:py-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                    <div className="sm:col-span-2">
                      <Field
                        label={t('currentPassword')}
                        value={currentPassword}
                        onChange={setCurrentPassword}
                        placeholder={t('currentPasswordPlaceholder')}
                        type="password"
                      />
                    </div>
                    <Field
                      label={t('newPassword')}
                      value={newPassword}
                      onChange={setNewPassword}
                      placeholder={t('newPasswordPlaceholder')}
                      type="password"
                    />
                    <Field
                      label={t('confirmPassword')}
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      placeholder={t('confirmPasswordPlaceholder')}
                      type="password"
                    />
                  </div>
                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={onChangePassword}
                      disabled={isChangingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                      className="px-5 py-2.5 border-2 border-[#162C66] text-[#162C66] rounded-xl text-[13px] font-bold hover:bg-[#162C66] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      {isChangingPassword ? feedbackT('loading.saving') : t('changePassword')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Sign Out */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="px-5 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                      <LogOut size={16} className="text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-[#0B1F44]">{t('signOut')}</p>
                      <p className="text-[12px] sm:text-[13px] text-slate-500 mt-0.5">{t('signOutDesc')}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await logout();
                      window.location.href = `/${locale}/auth/login`;
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-[#162C66] text-white rounded-xl text-[13px] font-bold hover:bg-[#0F1E45] transition-all shrink-0 shadow-sm"
                  >
                    {t('signOut')}
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              {getJobSeekerConfig().access.allowDeleteOwnAccount && (
                <div className="bg-white rounded-2xl border border-red-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
                  <div className="px-5 sm:px-6 py-4 sm:py-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                          <Trash2 size={16} className="text-red-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[14px] font-bold text-red-700">{t('deleteAccount')}</p>
                          <p className="text-[12px] sm:text-[13px] text-slate-500 mt-0.5 line-clamp-2">{t('deleteAccountDesc')}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                        className="w-full sm:w-auto px-5 py-2.5 border border-red-300 text-red-700 rounded-xl text-[13px] font-bold hover:bg-red-50 transition-all shrink-0"
                      >
                        {t('deleteAccountButton')}
                      </button>
                    </div>
                    {showDeleteConfirm && (
                      <div className="mt-4 pt-4 border-t border-red-100">
                        <p className="text-[13px] text-red-600 font-medium mb-3">{t('deleteConfirmPassword')}</p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder={t('currentPasswordPlaceholder')}
                            className="flex-1 px-4 py-2.5 bg-red-50/50 border border-red-200 rounded-xl text-[14px] font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                          />
                          <button
                            type="button"
                            onClick={onDeleteAccount}
                            disabled={isDeleting || !deletePassword}
                            className="px-5 py-2.5 bg-red-500 text-white rounded-xl text-[13px] font-bold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
                          >
                            {isDeleting ? feedbackT('loading.saving') : t('deleteAccountButton')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
