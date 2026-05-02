'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { Crown, ArrowLeft, Globe, Reply, Eye, Zap, Shield, Star, Sparkles, CheckCircle2, XCircle, Calendar, Receipt, CreditCard, RotateCcw, Loader2 } from 'lucide-react';
import FeedbackToast from '@/app/[locale]/dashboard/job-seeker/_components/FeedbackToast';
import { getIsPremium, refreshSession } from '@/lib/auth';
import { fetchPlans, createCheckoutSession, getSubscriptionDetails, cancelSubscription, reactivateSubscription, getInvoices, formatPrice, type PlanItem, type SubscriptionDetails, type InvoiceItem } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

// ─── Duration label per locale ──────────────────────────
const DURATION_LABELS: Record<string, Record<string, [string, string]>> = {
  month: {
    de: ['Monat', 'Monate'],
    en: ['month', 'months'],
    fr: ['mois', 'mois'],
    it: ['mese', 'mesi'],
    sq: ['muaj', 'muaj'],
  },
  week: {
    de: ['Woche', 'Wochen'],
    en: ['week', 'weeks'],
    fr: ['semaine', 'semaines'],
    it: ['settimana', 'settimane'],
    sq: ['javë', 'javë'],
  },
  day: {
    de: ['Tag', 'Tage'],
    en: ['day', 'days'],
    fr: ['jour', 'jours'],
    it: ['giorno', 'giorni'],
    sq: ['ditë', 'ditë'],
  },
};

function formatDuration(intervalCount: number, intervalType: string, locale: string): string {
  const labels = DURATION_LABELS[intervalType]?.[locale] ?? DURATION_LABELS[intervalType]?.de ?? ['', ''];
  return `${intervalCount} ${intervalCount === 1 ? labels[0] : labels[1]}`;
}

// ─── UI translations (no plan data) ────────────────────
const loc = {
  de: {
    back: 'Zurück zum Dashboard',
    heading: 'Werde Premium',
    subheading: 'Schalte alle Vorteile frei und finden Sie die besten Kandidaten.',
    benefits: [
      { text: 'Kandidaten weltweit unbegrenzt kontaktieren', icon: 'globe' },
      { text: 'Sei der Erste auf der Suchliste', icon: 'zap' },
      { text: 'Auf jede neue Nachricht unbegrenzt antworten', icon: 'reply' },
      { text: 'Sehen, wer Ihr Profil besucht hat', icon: 'eye' },
    ],
    perMonth: '/Monat',
    was: 'war',
    monthly: '€ monatlich',
    bestOffer: 'Bestes Angebot',
    choose: 'Wählen',
    goPremium: (p: string) => `Jetzt Premium aktivieren – ${p}`,
    activatedMsg: 'Premium wurde erfolgreich aktiviert!',
    alreadyPremium: 'Du bist bereits Premium-Mitglied!',
    successMsg: 'Premium wurde erfolgreich aktiviert! Willkommen!',
    canceledMsg: 'Checkout abgebrochen. Du kannst es jederzeit erneut versuchen.',
    trusted: 'Sicher & vertrauenswürdig',
    trustedDesc: 'Jederzeit kündbar. Keine versteckten Kosten.',
    nextPayment: 'Nächste Zahlung',
    plan: 'Aktueller Plan',
    memberSince: 'Mitglied seit',
    cancelSub: 'Abo kündigen',
    cancelConfirm: 'Möchtest du dein Abo wirklich kündigen?',
    cancelYes: 'Ja, kündigen',
    cancelNo: 'Abbrechen',
    canceledUntil: (d: string) => `Aktiv bis ${d}`,
    reactivate: 'Kündigung zurücknehmen',
    billingHistory: 'Rechnungen',
    download: 'PDF',
    cardEnding: (last4: string) => `Karte endet auf ${last4}`,
    loadingPlans: 'Tarife werden geladen…',
    noPlans: 'Aktuell keine Tarife verfügbar.',
  },
  en: {
    back: 'Back to Dashboard',
    heading: 'Go Premium',
    subheading: 'Unlock all benefits and find the best candidates.',
    benefits: [
      { text: 'Contact candidates worldwide without limits', icon: 'globe' },
      { text: 'Be the first on the searching list', icon: 'zap' },
      { text: 'Respond to every new message without limits', icon: 'reply' },
      { text: 'See who visited your profile', icon: 'eye' },
    ],
    perMonth: '/month',
    was: 'was',
    monthly: '€ monthly',
    bestOffer: 'Best Offer',
    choose: 'Choose',
    goPremium: (p: string) => `Activate Premium – ${p}`,
    activatedMsg: 'Premium has been activated successfully!',
    alreadyPremium: 'You are already a Premium member!',
    successMsg: 'Premium activated successfully! Welcome!',
    canceledMsg: 'Checkout canceled. You can try again anytime.',
    trusted: 'Secure & Trusted',
    trustedDesc: 'Cancel anytime. No hidden fees.',
    nextPayment: 'Next payment',
    plan: 'Current plan',
    memberSince: 'Member since',
    cancelSub: 'Cancel subscription',
    cancelConfirm: 'Do you really want to cancel your subscription?',
    cancelYes: 'Yes, cancel',
    cancelNo: 'Go back',
    canceledUntil: (d: string) => `Active until ${d}`,
    reactivate: 'Undo cancellation',
    billingHistory: 'Invoices',
    download: 'PDF',
    cardEnding: (last4: string) => `Card ending in ${last4}`,
    loadingPlans: 'Loading plans…',
    noPlans: 'No plans available at the moment.',
  },
  fr: {
    back: 'Retour au tableau de bord',
    heading: 'Devenir Premium',
    subheading: 'Débloquez tous les avantages et trouvez les meilleurs candidats.',
    benefits: [
      { text: 'Contacter des candidats sans limite', icon: 'globe' },
      { text: 'Soyez le premier sur la liste', icon: 'zap' },
      { text: 'Répondre sans limite à chaque message', icon: 'reply' },
      { text: 'Voir qui a visité votre profil', icon: 'eye' },
    ],
    perMonth: '/mois',
    was: 'était',
    monthly: '€ par mois',
    bestOffer: 'Meilleure offre',
    choose: 'Choisir',
    goPremium: (p: string) => `Activer Premium – ${p}`,
    activatedMsg: 'Premium a été activé avec succès !',
    alreadyPremium: 'Vous êtes déjà membre Premium !',
    successMsg: 'Premium activé avec succès ! Bienvenue !',
    canceledMsg: 'Paiement annulé. Vous pouvez réessayer.',
    trusted: 'Sécurisé & fiable',
    trustedDesc: 'Annulez à tout moment. Pas de frais cachés.',
    nextPayment: 'Prochain paiement',
    plan: 'Plan actuel',
    memberSince: 'Membre depuis',
    cancelSub: 'Résilier l\'abonnement',
    cancelConfirm: 'Voulez-vous vraiment résilier ?',
    cancelYes: 'Oui, résilier',
    cancelNo: 'Retour',
    canceledUntil: (d: string) => `Actif jusqu'au ${d}`,
    reactivate: 'Annuler la résiliation',
    billingHistory: 'Factures',
    download: 'PDF',
    cardEnding: (last4: string) => `Carte se terminant par ${last4}`,
    loadingPlans: 'Chargement des plans…',
    noPlans: 'Aucun plan disponible pour le moment.',
  },
  it: {
    back: 'Torna alla dashboard',
    heading: 'Diventa Premium',
    subheading: 'Sblocca tutti i vantaggi e trova i migliori candidati.',
    benefits: [
      { text: 'Contatta candidati senza limiti', icon: 'globe' },
      { text: 'Sii il primo nella lista di ricerca', icon: 'zap' },
      { text: 'Rispondi senza limiti a ogni messaggio', icon: 'reply' },
      { text: 'Scopri chi ha visitato il tuo profilo', icon: 'eye' },
    ],
    perMonth: '/mese',
    was: 'era',
    monthly: '€ al mese',
    bestOffer: 'Migliore offerta',
    choose: 'Scegli',
    goPremium: (p: string) => `Attiva Premium – ${p} `,
    activatedMsg: 'Premium è stato attivato con successo!',
    alreadyPremium: 'Sei già un membro Premium!',
    successMsg: 'Premium attivato con successo! Benvenuto!',
    canceledMsg: 'Checkout annullato. Puoi riprovare quando vuoi.',
    trusted: 'Sicuro e affidabile',
    trustedDesc: 'Annulla in qualsiasi momento. Nessun costo nascosto.',
    nextPayment: 'Prossimo pagamento',
    plan: 'Piano attuale',
    memberSince: 'Membro dal',
    cancelSub: 'Annulla abbonamento',
    cancelConfirm: 'Vuoi davvero annullare il tuo abbonamento?',
    cancelYes: 'Sì, annulla',
    cancelNo: 'Indietro',
    canceledUntil: (d: string) => `Attivo fino al ${d}`,
    reactivate: 'Annulla la cancellazione',
    billingHistory: 'Fatture',
    download: 'PDF',
    cardEnding: (last4: string) => `Carta che termina con ${last4}`,
    loadingPlans: 'Caricamento piani…',
    noPlans: 'Nessun piano disponibile al momento.',
  },
  sq: {
    back: 'Kthehu në panel',
    heading: 'Bëhu Premium',
    subheading: 'Zhblloko të gjitha përparësitë dhe gjeni kandidatët më të mirë.',
    benefits: [
      { text: 'Kontaktoni kandidatët pa kufizime', icon: 'globe' },
      { text: 'Jini i pari në listën e kërkimit', icon: 'zap' },
      { text: 'Përgjigjuni pa kufizime çdo mesazhi', icon: 'reply' },
      { text: 'Shikoni kush ka vizituar profilin tuaj', icon: 'eye' },
    ],
    perMonth: '/muaj',
    was: 'ishte',
    monthly: '€ në muaj',
    bestOffer: 'Oferta më e mirë',
    choose: 'Zgjidh',
    goPremium: (p: string) => `Aktivizo Premium – ${p}`,
    activatedMsg: 'Premium u aktivizua me sukses!',
    alreadyPremium: 'Ju jeni tashmë anëtar Premium!',
    successMsg: 'Premium u aktivizua me sukses! Mirë se vini!',
    canceledMsg: 'Checkout u anulua. Mund të provoni përsëri.',
    trusted: 'I sigurt & i besueshëm',
    trustedDesc: 'Anuloni në çdo kohë. Pa tarifa të fshehura.',
    nextPayment: 'Pagesa e ardhshme',
    plan: 'Plani aktual',
    memberSince: 'Anëtar që nga',
    cancelSub: 'Anulo abonimin',
    cancelConfirm: 'A dëshironi vërtet të anuloni abonimin?',
    cancelYes: 'Po, anulo',
    cancelNo: 'Kthehu',
    canceledUntil: (d: string) => `Aktiv deri më ${d}`,
    reactivate: 'Rikthe abonimin',
    billingHistory: 'Faturat',
    download: 'PDF',
    cardEnding: (last4: string) => `Kartë që përfundon me ${last4}`,
    loadingPlans: 'Duke ngarkuar planet…',
    noPlans: 'Asnjë plan i disponueshëm për momentin.',
  },
} as const;

const BENEFIT_ICONS = { globe: Globe, zap: Zap, reply: Reply, eye: Eye } as const;

export default function EmployerPremiumPage() {
  const locale = useLocale() as keyof typeof loc;
  const t = loc[locale] ?? loc.de;
  const searchParams = useSearchParams();

  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sub, setSub] = useState<SubscriptionDetails | null>(null);
  const [invoiceList, setInvoiceList] = useState<InvoiceItem[]>([]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    fetchPlans('employer').then(p => {
      setPlans(p);
      setPlansLoading(false);
      // Pre-select the second plan (or first if only one)
      const bestIdx = p.findIndex(pl => pl.isBestOffer);
      if (bestIdx >= 0) setSelectedIndex(bestIdx);
      else if (p.length > 1) setSelectedIndex(1);
    });

    setIsPremium(getIsPremium());
    getSubscriptionDetails().then(s => {
      setSub(s);
      if (s?.active) setIsPremium(true);
    });
    getInvoices().then(setInvoiceList);

    if (searchParams.get('success') === 'true') {
      setToast(t.successMsg);
      setIsPremium(true);
      // Poll refreshSession until isPremium is true in DB (webhook may be delayed)
      let attempts = 0;
      const pollPremium = async () => {
        while (attempts < 10) {
          await refreshSession();
          if (getIsPremium()) break;
          attempts++;
          await new Promise(r => setTimeout(r, 2000));
        }
        setIsPremium(getIsPremium());
      };
      pollPremium();
      getSubscriptionDetails().then(setSub);
      getInvoices().then(setInvoiceList);
    } else if (searchParams.get('canceled') === 'true') {
      setToast(t.canceledMsg);
    }
  }, []);

  const selectedPlan = plans[selectedIndex] as PlanItem | undefined;

  const handleCheckout = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    const result = await createCheckoutSession(selectedPlan.id, locale);
    if (!result.ok) {
      setLoading(false);
      setToast('Error: ' + result.error);
    }
  };

  const handleCancel = async () => {
    setCancelLoading(true);
    const result = await cancelSubscription();
    setCancelLoading(false);
    setShowCancelConfirm(false);
    if (result.ok) {
      setToast(t.canceledUntil(new Date(result.endDate).toLocaleDateString(locale)));
      getSubscriptionDetails().then(setSub);
    } else {
      setToast('Error: ' + result.error);
    }
  };

  const handleReactivate = async () => {
    setCancelLoading(true);
    const result = await reactivateSubscription();
    setCancelLoading(false);
    if (result.ok) {
      setToast(t.activatedMsg);
      getSubscriptionDetails().then(setSub);
    } else {
      setToast('Error: ' + result.error);
    }
  };

  return (
    <>
      <FeedbackToast message={toast} onDismiss={() => setToast(null)} />

      <div className="mb-6">
        <Link
          href="/dashboard/employer"
          className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#162C66] transition-colors"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
          {t.back}
        </Link>
      </div>

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B1F44] via-[#162C66] to-[#1e3a80] px-6 py-6 sm:px-8 sm:py-8 mb-8">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#F5C400]/15 to-transparent rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/[0.03] rounded-full translate-y-1/2 -translate-x-1/3" />

        <div className="relative z-10 flex items-center gap-5">
          <div className="w-14 h-14 bg-gradient-to-br from-[#F5C400] to-[#FFD740] rounded-xl flex items-center justify-center shadow-lg shadow-[#F5C400]/25 shrink-0">
            <Crown size={28} className="text-[#162C66]" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F5C400]/20 rounded-full mb-2">
              <Sparkles size={12} className="text-[#F5C400]" />
              <span className="text-[11px] font-bold text-[#F5C400]">PREMIUM</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {t.heading}
            </h1>
            <p className="text-sm text-white/50 font-medium mt-1">
              {t.subheading}
            </p>
          </div>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-12">
        {t.benefits.map((b, i) => {
          const BIcon = BENEFIT_ICONS[b.icon as keyof typeof BENEFIT_ICONS];
          return (
            <div
              key={i}
              className="group flex items-start gap-4 bg-white rounded-2xl border border-slate-200/60 p-5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="w-11 h-11 bg-gradient-to-br from-[#F5C400]/20 to-[#F5C400]/5 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <BIcon size={20} className="text-[#F5C400]" />
              </div>
              <div>
                <span className="text-[15px] font-bold text-[#0B1F44] leading-snug">{b.text}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pricing Plans – dynamic from DB */}
      <div className="max-w-3xl mx-auto mb-8">
        {plansLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm font-medium">{t.loadingPlans}</span>
          </div>
        ) : plans.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-12">{t.noPlans}</p>
        ) : (
          <div className={`grid grid-cols-1 gap-5 ${plans.length === 2 ? 'sm:grid-cols-2 max-w-2xl mx-auto' : plans.length >= 3 ? 'sm:grid-cols-3' : 'max-w-sm mx-auto'}`}>
            {plans.map((plan, i) => {
              const isSelected = selectedIndex === i;
              const price = plan.amountCents / 100;
              const oldPrice = plan.oldPriceCents ? plan.oldPriceCents / 100 : null;
              const perMonth = plan.intervalCount > 1
                ? Math.round((price / plan.intervalCount) * 100) / 100
                : null;

              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedIndex(i)}
                  className={`relative flex flex-col items-center text-center rounded-2xl border-2 transition-all duration-300 ${
                    plan.isBestOffer
                      ? 'p-7 sm:p-8 -mt-2 sm:-mt-4'
                      : 'p-6 sm:p-7'
                  } ${
                    isSelected
                      ? 'border-[#F5C400] bg-gradient-to-b from-[#F5C400]/[0.04] to-white shadow-xl shadow-[#F5C400]/10 scale-[1.02]'
                      : 'border-slate-200 bg-white hover:border-[#F5C400]/40 hover:shadow-lg'
                  }`}
                >
                  {plan.isBestOffer && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 bg-gradient-to-r from-[#F5C400] to-[#FFD740] text-[#162C66] text-[11px] font-extrabold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-md whitespace-nowrap">
                      <Star size={12} fill="currentColor" />
                      {t.bestOffer}
                    </span>
                  )}

                  <span className="text-[15px] font-bold text-[#0B1F44] mb-5">
                    {formatDuration(plan.intervalCount, plan.intervalType, locale)}
                  </span>

                  <div className="mb-1">
                    <span className="text-4xl sm:text-5xl font-extrabold text-emerald-600 leading-none">{price}</span>
                    <span className="text-base font-bold text-emerald-600 ml-1">€</span>
                  </div>

                  {oldPrice && (
                    <span className="text-[13px] text-slate-400 font-medium">
                      {t.was} <span className="line-through text-red-400">{oldPrice} €</span>
                    </span>
                  )}

                  {perMonth ? (
                    <span className="text-[13px] text-slate-400 font-medium mt-1 mb-5">
                      {perMonth} {t.monthly}
                    </span>
                  ) : (
                    <span className="text-[13px] text-slate-400 font-medium mb-5">&nbsp;</span>
                  )}

                  <span
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all mt-auto ${
                      isSelected
                        ? 'bg-[#162C66] text-white shadow-md'
                        : 'bg-slate-100 text-[#162C66] hover:bg-slate-200'
                    }`}
                  >
                    {t.choose}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* CTA / Subscription Details */}
      <div className="max-w-2xl mx-auto mb-8 space-y-4">
        {isPremium && sub?.active ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 py-4 px-6 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <CheckCircle2 size={20} className="text-emerald-500" />
              <span className="text-sm font-bold text-emerald-700">{t.alreadyPremium}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white rounded-xl border border-slate-200/60 p-4">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{t.plan}</p>
                <div className="flex items-center gap-2">
                  <Crown size={16} className="text-[#F5C400]" />
                  <span className="text-sm font-bold text-[#0B1F44]">Premium {sub.planMonths} {sub.planMonths === 1 ? 'Mo' : 'Mo.'}</span>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200/60 p-4">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{t.memberSince}</p>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-slate-400" />
                  <span className="text-sm font-bold text-[#0B1F44]">{new Date(sub.currentPeriodStart).toLocaleDateString(locale)}</span>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200/60 p-4">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{t.nextPayment}</p>
                <div className="flex items-center gap-2">
                  <Receipt size={16} className="text-slate-400" />
                  <span className="text-sm font-bold text-[#0B1F44]">
                    {sub.cancelAtPeriodEnd ? '—' : `${formatPrice(sub.amountCents, sub.currency)} · ${new Date(sub.currentPeriodEnd).toLocaleDateString(locale)}`}
                  </span>
                </div>
              </div>
            </div>

            {sub.paymentMethod && (
              <div className="bg-white rounded-xl border border-slate-200/60 p-4 flex items-center gap-3">
                <CreditCard size={18} className="text-slate-400" />
                <span className="text-sm font-semibold text-[#0B1F44] capitalize">{sub.paymentMethod.brand}</span>
                <span className="text-sm text-slate-500">{t.cardEnding(sub.paymentMethod.last4)}</span>
                <span className="text-xs text-slate-400 ml-auto">{sub.paymentMethod.expMonth}/{sub.paymentMethod.expYear}</span>
              </div>
            )}

            {invoiceList.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-[#0B1F44]">{t.billingHistory}</h3>
                </div>
                <div className="divide-y divide-slate-50">
                  {invoiceList.slice(0, 5).map(inv => (
                    <div key={inv.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-[#0B1F44]">{formatPrice(inv.amountCents, inv.currency)}</span>
                        <span className="text-xs text-slate-400 ml-2">{new Date(inv.date).toLocaleDateString(locale)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>{inv.status}</span>
                        {inv.pdfUrl && (
                          <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#162C66] hover:underline">
                            {t.download}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sub.cancelAtPeriodEnd ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800">{t.canceledUntil(new Date(sub.currentPeriodEnd).toLocaleDateString(locale))}</p>
                </div>
                <button
                  type="button"
                  onClick={handleReactivate}
                  disabled={cancelLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#162C66] bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  <RotateCcw size={14} />
                  {cancelLoading ? '...' : t.reactivate}
                </button>
              </div>
            ) : (
              <div>
                {showCancelConfirm ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <p className="text-sm font-semibold text-red-700 flex-1">{t.cancelConfirm}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={cancelLoading}
                        className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-all disabled:opacity-50"
                      >
                        {cancelLoading ? '...' : t.cancelYes}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCancelConfirm(false)}
                        className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                      >
                        {t.cancelNo}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-all"
                  >
                    <XCircle size={15} />
                    {t.cancelSub}
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          selectedPlan && (
            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading}
              className="group w-full flex items-center justify-center gap-3 h-16 bg-gradient-to-r from-[#F5C400] to-[#FFD740] text-[#162C66] font-extrabold text-lg rounded-2xl shadow-xl shadow-[#F5C400]/25 hover:shadow-2xl hover:shadow-[#F5C400]/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={22} className="animate-spin" />
              ) : (
                <Crown size={22} className="group-hover:rotate-12 transition-transform" />
              )}
              {loading ? '...' : t.goPremium(formatPrice(selectedPlan.amountCents, selectedPlan.currency))}
            </button>
          )
        )}
      </div>

      {/* Trust Badge */}
      <div className="text-center pb-4">
        <div className="inline-flex items-center gap-2 text-slate-400 mb-2">
          <Shield size={16} />
          <span className="text-[13px] font-semibold">{t.trusted}</span>
        </div>
        <p className="text-[12px] text-slate-400">{t.trustedDesc}</p>
      </div>
    </>
  );
}
