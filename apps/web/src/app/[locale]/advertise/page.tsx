'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Building2, Mail, Globe, Upload, Check, Loader2, Star, Clock, Eye, Shield, Sparkles, ArrowRight, X, CheckCircle2, XCircle } from 'lucide-react';
import { clsx } from 'clsx';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const ui = {
  de: {
    heroTag: 'Werbung auf gjej-pune.com',
    heroTitle: 'Ihr Logo auf unserer Startseite',
    heroSub: 'Erreichen Sie tausende Arbeitssuchende und Unternehmen. Präsentieren Sie Ihre Marke dort, wo Karrieren beginnen.',
    stat1: '10\'000+', stat1l: 'Monatliche Besucher',
    stat2: '500+', stat2l: 'Aktive Unternehmen',
    stat3: '24/7', stat3l: 'Sichtbarkeit',
    packagesTitle: 'Wählen Sie Ihr Paket',
    packagesSub: 'Transparente Preise, keine versteckten Kosten.',
    perMonth: '/Monat',
    total: 'Total',
    months: 'Monate',
    selectPlan: 'Dieses Paket wählen',
    popular: 'Beliebt',
    bestValue: 'Bestes Angebot',
    feat1: 'Logo auf der Startseite',
    feat2: 'Link zu Ihrer Webseite',
    feat3: 'Innerhalb 24h aktiviert',
    feat4: 'Auto-Ablauf, kein Abo',
    formTitle: 'Bestellung aufgeben',
    formSub: 'Füllen Sie das Formular aus und bezahlen Sie sicher via Stripe.',
    companyName: 'Firmenname',
    companyNamePh: 'Muster AG',
    email: 'E-Mail-Adresse',
    emailPh: 'info@firma.ch',
    website: 'Webseite (optional)',
    websitePh: 'https://www.firma.ch',
    logo: 'Logo hochladen',
    logoPh: 'PNG, JPG oder SVG (max. 5 MB)',
    logoChange: 'Ändern',
    selectedPlan: 'Gewähltes Paket',
    pay: 'Jetzt bezahlen',
    paying: 'Weiterleitung zu Stripe...',
    successTitle: 'Bestellung eingegangen!',
    successDesc: 'Vielen Dank! Wir haben Ihre Bestellung und Zahlung erhalten. Ihr Logo wird innerhalb von 24 Stunden auf unserer Startseite aufgeschaltet.',
    canceledTitle: 'Zahlung abgebrochen',
    canceledDesc: 'Die Zahlung wurde abgebrochen. Sie können es jederzeit erneut versuchen.',
    tryAgain: 'Erneut versuchen',
    errorGeneric: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
    howTitle: 'So funktioniert es',
    step1t: 'Paket wählen', step1d: 'Wählen Sie zwischen 3 oder 6 Monaten Laufzeit.',
    step2t: 'Bezahlen', step2d: 'Sichere Zahlung via Stripe. Keine Abos.',
    step3t: 'Logo wird aktiviert', step3d: 'Wir schalten Ihr Logo innerhalb von 24h frei.',
    step4t: 'Sichtbarkeit', step4d: 'Ihr Logo erscheint für alle Besucher auf der Startseite.',
  },
  en: {
    heroTag: 'Advertise on gjej-pune.com',
    heroTitle: 'Your logo on our homepage',
    heroSub: 'Reach thousands of job seekers and companies. Showcase your brand where careers begin.',
    stat1: '10\'000+', stat1l: 'Monthly visitors',
    stat2: '500+', stat2l: 'Active companies',
    stat3: '24/7', stat3l: 'Visibility',
    packagesTitle: 'Choose your package',
    packagesSub: 'Transparent pricing, no hidden costs.',
    perMonth: '/month',
    total: 'Total',
    months: 'months',
    selectPlan: 'Select this package',
    popular: 'Popular',
    bestValue: 'Best value',
    feat1: 'Logo on homepage',
    feat2: 'Link to your website',
    feat3: 'Activated within 24h',
    feat4: 'Auto-expires, no subscription',
    formTitle: 'Place your order',
    formSub: 'Fill in the form and pay securely via Stripe.',
    companyName: 'Company name',
    companyNamePh: 'Acme Inc.',
    email: 'Email address',
    emailPh: 'info@company.com',
    website: 'Website (optional)',
    websitePh: 'https://www.company.com',
    logo: 'Upload logo',
    logoPh: 'PNG, JPG or SVG (max 5 MB)',
    logoChange: 'Change',
    selectedPlan: 'Selected package',
    pay: 'Pay now',
    paying: 'Redirecting to Stripe...',
    successTitle: 'Order received!',
    successDesc: 'Thank you! We have received your order and payment. Your logo will be live on our homepage within 24 hours.',
    canceledTitle: 'Payment canceled',
    canceledDesc: 'The payment was canceled. You can try again anytime.',
    tryAgain: 'Try again',
    errorGeneric: 'An error occurred. Please try again.',
    howTitle: 'How it works',
    step1t: 'Choose package', step1d: 'Select between 3 or 6 months duration.',
    step2t: 'Pay', step2d: 'Secure payment via Stripe. No subscriptions.',
    step3t: 'Logo activated', step3d: 'We activate your logo within 24 hours.',
    step4t: 'Visibility', step4d: 'Your logo appears for all visitors on the homepage.',
  },
  fr: {
    heroTag: 'Publicite sur gjej-pune.com',
    heroTitle: 'Votre logo sur notre page d\'accueil',
    heroSub: 'Atteignez des milliers de chercheurs d\'emploi et d\'entreprises. Presentez votre marque la ou les carrieres commencent.',
    stat1: '10\'000+', stat1l: 'Visiteurs mensuels',
    stat2: '500+', stat2l: 'Entreprises actives',
    stat3: '24/7', stat3l: 'Visibilite',
    packagesTitle: 'Choisissez votre forfait',
    packagesSub: 'Prix transparents, sans frais caches.',
    perMonth: '/mois',
    total: 'Total',
    months: 'mois',
    selectPlan: 'Choisir ce forfait',
    popular: 'Populaire',
    bestValue: 'Meilleure offre',
    feat1: 'Logo sur la page d\'accueil',
    feat2: 'Lien vers votre site',
    feat3: 'Active sous 24h',
    feat4: 'Expiration auto, pas d\'abonnement',
    formTitle: 'Passer commande',
    formSub: 'Remplissez le formulaire et payez en toute securite via Stripe.',
    companyName: 'Nom de l\'entreprise',
    companyNamePh: 'Entreprise SA',
    email: 'Adresse e-mail',
    emailPh: 'info@entreprise.ch',
    website: 'Site web (optionnel)',
    websitePh: 'https://www.entreprise.ch',
    logo: 'Telecharger le logo',
    logoPh: 'PNG, JPG ou SVG (max 5 Mo)',
    logoChange: 'Changer',
    selectedPlan: 'Forfait choisi',
    pay: 'Payer maintenant',
    paying: 'Redirection vers Stripe...',
    successTitle: 'Commande recue !',
    successDesc: 'Merci ! Nous avons recu votre commande et paiement. Votre logo sera en ligne sur notre page d\'accueil sous 24 heures.',
    canceledTitle: 'Paiement annule',
    canceledDesc: 'Le paiement a ete annule. Vous pouvez reessayer a tout moment.',
    tryAgain: 'Reessayer',
    errorGeneric: 'Une erreur est survenue. Veuillez reessayer.',
    howTitle: 'Comment ca marche',
    step1t: 'Choisir le forfait', step1d: 'Selectionnez entre 3 ou 6 mois de duree.',
    step2t: 'Payer', step2d: 'Paiement securise via Stripe. Pas d\'abonnement.',
    step3t: 'Logo active', step3d: 'Nous activons votre logo sous 24 heures.',
    step4t: 'Visibilite', step4d: 'Votre logo apparait pour tous les visiteurs sur la page d\'accueil.',
  },
  it: {
    heroTag: 'Pubblicita su gjej-pune.com',
    heroTitle: 'Il vostro logo sulla nostra homepage',
    heroSub: 'Raggiungete migliaia di candidati e aziende. Presentate il vostro marchio dove iniziano le carriere.',
    stat1: '10\'000+', stat1l: 'Visitatori mensili',
    stat2: '500+', stat2l: 'Aziende attive',
    stat3: '24/7', stat3l: 'Visibilita',
    packagesTitle: 'Scegliete il vostro pacchetto',
    packagesSub: 'Prezzi trasparenti, senza costi nascosti.',
    perMonth: '/mese',
    total: 'Totale',
    months: 'mesi',
    selectPlan: 'Scegli questo pacchetto',
    popular: 'Popolare',
    bestValue: 'Miglior offerta',
    feat1: 'Logo sulla homepage',
    feat2: 'Link al vostro sito',
    feat3: 'Attivato entro 24h',
    feat4: 'Scadenza automatica, nessun abbonamento',
    formTitle: 'Effettuare l\'ordine',
    formSub: 'Compilate il modulo e pagate in modo sicuro tramite Stripe.',
    companyName: 'Nome azienda',
    companyNamePh: 'Azienda SA',
    email: 'Indirizzo e-mail',
    emailPh: 'info@azienda.ch',
    website: 'Sito web (opzionale)',
    websitePh: 'https://www.azienda.ch',
    logo: 'Carica logo',
    logoPh: 'PNG, JPG o SVG (max 5 MB)',
    logoChange: 'Cambia',
    selectedPlan: 'Pacchetto scelto',
    pay: 'Paga ora',
    paying: 'Reindirizzamento a Stripe...',
    successTitle: 'Ordine ricevuto!',
    successDesc: 'Grazie! Abbiamo ricevuto il vostro ordine e pagamento. Il vostro logo sara online sulla nostra homepage entro 24 ore.',
    canceledTitle: 'Pagamento annullato',
    canceledDesc: 'Il pagamento e stato annullato. Potete riprovare in qualsiasi momento.',
    tryAgain: 'Riprova',
    errorGeneric: 'Si e verificato un errore. Riprovare.',
    howTitle: 'Come funziona',
    step1t: 'Scegli il pacchetto', step1d: 'Selezionate tra 3 o 6 mesi di durata.',
    step2t: 'Paga', step2d: 'Pagamento sicuro tramite Stripe. Nessun abbonamento.',
    step3t: 'Logo attivato', step3d: 'Attiviamo il vostro logo entro 24 ore.',
    step4t: 'Visibilita', step4d: 'Il vostro logo appare per tutti i visitatori sulla homepage.',
  },
  sq: {
    heroTag: 'Reklamoni ne gjej-pune.com',
    heroTitle: 'Logoja juaj ne faqen kryesore',
    heroSub: 'Arrini mijera kerkues pune dhe kompani. Prezantoni marken tuaj atje ku fillojne karrierat.',
    stat1: '10\'000+', stat1l: 'Vizitore mujore',
    stat2: '500+', stat2l: 'Kompani aktive',
    stat3: '24/7', stat3l: 'Dukshmeri',
    packagesTitle: 'Zgjidhni paketen tuaj',
    packagesSub: 'Cmime transparente, pa kosto te fshehura.',
    perMonth: '/muaj',
    total: 'Totali',
    months: 'muaj',
    selectPlan: 'Zgjidh kete paket',
    popular: 'Popullore',
    bestValue: 'Oferta me e mire',
    feat1: 'Logo ne faqen kryesore',
    feat2: 'Link per ne faqen tuaj',
    feat3: 'Aktivizohet brenda 24h',
    feat4: 'Skadon automatikisht, pa abonim',
    formTitle: 'Beni porosine',
    formSub: 'Plotesoni formularin dhe paguani me siguri permes Stripe.',
    companyName: 'Emri i kompanise',
    companyNamePh: 'Kompania SH.P.K.',
    email: 'Adresa e-mail',
    emailPh: 'info@kompania.com',
    website: 'Faqja e internetit (opsionale)',
    websitePh: 'https://www.kompania.com',
    logo: 'Ngarko logon',
    logoPh: 'PNG, JPG ose SVG (max 5 MB)',
    logoChange: 'Ndrysho',
    selectedPlan: 'Paketa e zgjedhur',
    pay: 'Paguaj tani',
    paying: 'Duke u ridrejtuar te Stripe...',
    successTitle: 'Porosia u pranua!',
    successDesc: 'Faleminderit! Kemi pranuar porosine dhe pagesen tuaj. Logoja juaj do te jete ne faqen tone kryesore brenda 24 oreve.',
    canceledTitle: 'Pagesa u anulua',
    canceledDesc: 'Pagesa u anulua. Mund te provoni perseri ne cdo kohe.',
    tryAgain: 'Provo perseri',
    errorGeneric: 'Ndodhi nje gabim. Ju lutem provoni perseri.',
    howTitle: 'Si funksionon',
    step1t: 'Zgjidh paketen', step1d: 'Zgjidhni midis 3 ose 6 muajve kohe.',
    step2t: 'Paguaj', step2d: 'Pagese e sigurt permes Stripe. Pa abonim.',
    step3t: 'Logo aktivizohet', step3d: 'Ne e aktivizojme logon tuaj brenda 24 oreve.',
    step4t: 'Dukshmeria', step4d: 'Logoja juaj shfaqet per te gjithe vizitoret ne faqen kryesore.',
  },
} as const;

const plans = [
  { id: '3_months' as const, months: 3, monthlyPrice: 60, totalPrice: 180 },
  { id: '6_months' as const, months: 6, monthlyPrice: 50, totalPrice: 300 },
];

export default function AdvertisePage() {
  const locale = useLocale() as keyof typeof ui;
  const t = ui[locale] ?? ui.de;
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';
  const isCanceled = searchParams.get('canceled') === 'true';

  const [selectedPlan, setSelectedPlan] = useState<'3_months' | '6_months'>('6_months');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!companyName.trim() || !email.trim()) return;
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('companyName', companyName.trim());
      formData.append('companyEmail', email.trim());
      formData.append('plan', selectedPlan);
      formData.append('locale', locale);
      if (website.trim()) formData.append('companyWebsite', website.trim());
      if (logoFile) formData.append('logo', logoFile);

      const res = await fetch(`${API_URL}/api/ad-placements/checkout`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(t.errorGeneric);
        setLoading(false);
      }
    } catch {
      setError(t.errorGeneric);
      setLoading(false);
    }
  };

  const currentPlan = plans.find(p => p.id === selectedPlan)!;
  const features = [t.feat1, t.feat2, t.feat3, t.feat4];
  const steps = [
    { icon: Sparkles, title: t.step1t, desc: t.step1d },
    { icon: Shield, title: t.step2t, desc: t.step2d },
    { icon: Clock, title: t.step3t, desc: t.step3d },
    { icon: Eye, title: t.step4t, desc: t.step4d },
  ];

  // Success / Canceled states
  if (isSuccess) {
    return (
      <>
        <Header />
        <main className="min-h-[70vh] flex items-center justify-center px-4 py-20 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <h1 className="text-2xl font-black text-[#0B1F44] mb-3">{t.successTitle}</h1>
            <p className="text-slate-500 text-[15px] leading-relaxed">{t.successDesc}</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (isCanceled) {
    return (
      <>
        <Header />
        <main className="min-h-[70vh] flex items-center justify-center px-4 py-20 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <XCircle size={40} className="text-amber-500" />
            </div>
            <h1 className="text-2xl font-black text-[#0B1F44] mb-3">{t.canceledTitle}</h1>
            <p className="text-slate-500 text-[15px] leading-relaxed mb-6">{t.canceledDesc}</p>
            <a href={`/${locale}/advertise`} className="inline-flex items-center gap-2 px-6 py-3 bg-[#162C66] text-white font-bold text-sm rounded-xl hover:bg-[#0F1E45] transition-all">
              <ArrowRight size={16} />
              {t.tryAgain}
            </a>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="bg-white">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0B1F44] via-[#162C66] to-[#1a3577]">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full text-[12px] font-bold text-white/70 uppercase tracking-wider mb-6">
              <Star size={12} className="text-[#F5C400]" />
              {t.heroTag}
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight mb-5">
              {t.heroTitle}
            </h1>
            <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed mb-10">
              {t.heroSub}
            </p>
            <div className="flex items-center justify-center gap-8 sm:gap-14">
              {[{ v: t.stat1, l: t.stat1l }, { v: t.stat2, l: t.stat2l }, { v: t.stat3, l: t.stat3l }].map((s, i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl sm:text-3xl font-black text-[#F5C400]">{s.v}</p>
                  <p className="text-[11px] sm:text-[13px] text-white/40 font-medium mt-1">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Packages ── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-[#0B1F44] mb-3">{t.packagesTitle}</h2>
            <p className="text-slate-500 text-[15px]">{t.packagesSub}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              const isBest = plan.id === '6_months';
              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={clsx(
                    'relative text-left p-6 sm:p-8 rounded-2xl border-2 transition-all duration-200',
                    isSelected
                      ? 'border-[#162C66] bg-[#162C66]/[0.03] shadow-lg shadow-[#162C66]/10'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  )}
                >
                  {isBest && (
                    <span className="absolute -top-3 left-6 px-3 py-1 bg-[#F5C400] text-[#162C66] text-[10px] font-black uppercase tracking-wide rounded-full">
                      {t.bestValue}
                    </span>
                  )}
                  {!isBest && (
                    <span className="absolute -top-3 left-6 px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wide rounded-full">
                      {t.popular}
                    </span>
                  )}

                  <div className="flex items-end gap-1 mb-1 mt-2">
                    <span className="text-4xl font-black text-[#0B1F44]">{plan.monthlyPrice}</span>
                    <span className="text-lg font-bold text-slate-400 mb-1">CHF</span>
                    <span className="text-sm text-slate-400 mb-1.5">{t.perMonth}</span>
                  </div>
                  <p className="text-[13px] text-slate-400 font-medium mb-5">
                    {t.total}: {plan.totalPrice} CHF / {plan.months} {t.months}
                  </p>

                  <ul className="space-y-2.5 mb-6">
                    {features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-[13px] text-slate-600">
                        <Check size={14} className={isSelected ? 'text-[#162C66]' : 'text-slate-300'} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className={clsx(
                    'w-full py-3 rounded-xl text-center text-sm font-bold transition-all',
                    isSelected
                      ? 'bg-[#162C66] text-white'
                      : 'bg-slate-100 text-slate-500'
                  )}>
                    {isSelected ? <Check size={16} className="inline mr-1.5 -mt-0.5" /> : null}
                    {t.selectPlan}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Order Form ── */}
        <section id="order" className="bg-slate-50 border-y border-slate-100">
          <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-black text-[#0B1F44] mb-2">{t.formTitle}</h2>
              <p className="text-slate-500 text-[14px]">{t.formSub}</p>
            </div>

            <div className="space-y-5">
              {/* Selected plan badge */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#162C66]/[0.04] border border-[#162C66]/10 rounded-xl">
                <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wide">{t.selectedPlan}</span>
                <span className="text-[14px] font-black text-[#162C66]">
                  {currentPlan.monthlyPrice} CHF{t.perMonth} &middot; {currentPlan.months} {t.months}
                </span>
              </div>

              {/* Company name */}
              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                  <Building2 size={12} />{t.companyName}
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={t.companyNamePh}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-[#0B1F44] placeholder:text-slate-400 focus:ring-2 focus:ring-[#162C66]/10 focus:border-[#162C66]/30 outline-none transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                  <Mail size={12} />{t.email}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPh}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-[#0B1F44] placeholder:text-slate-400 focus:ring-2 focus:ring-[#162C66]/10 focus:border-[#162C66]/30 outline-none transition-all"
                />
              </div>

              {/* Website */}
              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                  <Globe size={12} />{t.website}
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder={t.websitePh}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-[#0B1F44] placeholder:text-slate-400 focus:ring-2 focus:ring-[#162C66]/10 focus:border-[#162C66]/30 outline-none transition-all"
                />
              </div>

              {/* Logo upload */}
              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                  <Upload size={12} />{t.logo}
                </label>
                {logoPreview ? (
                  <div className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl">
                    <img src={logoPreview} alt="" className="h-14 w-auto max-w-[120px] object-contain rounded-lg" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0B1F44] truncate">{logoFile?.name}</p>
                      <p className="text-[11px] text-slate-400">{logoFile ? `${(logoFile.size / 1024).toFixed(0)} KB` : ''}</p>
                    </div>
                    <label className="shrink-0 px-3 py-1.5 text-[12px] font-bold text-[#162C66] bg-[#162C66]/5 rounded-lg cursor-pointer hover:bg-[#162C66]/10 transition-colors">
                      {t.logoChange}
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                    </label>
                    <button onClick={() => { setLogoFile(null); setLogoPreview(null); }} className="text-slate-400 hover:text-red-500 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 p-8 bg-white border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-[#162C66]/30 hover:bg-[#162C66]/[0.02] transition-all group">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-[#162C66]/10 transition-colors">
                      <Upload size={20} className="text-slate-400 group-hover:text-[#162C66] transition-colors" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">{t.logoPh}</p>
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                  </label>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={loading || !companyName.trim() || !email.trim()}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-4 bg-gradient-to-r from-[#F5C400] to-[#FFD740] text-[#162C66] text-[15px] font-black rounded-xl shadow-lg shadow-[#F5C400]/20 hover:shadow-xl hover:shadow-[#F5C400]/30 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {t.paying}
                  </>
                ) : (
                  <>
                    {t.pay}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <h2 className="text-2xl font-black text-[#0B1F44] text-center mb-12">{t.howTitle}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 bg-[#162C66]/[0.05] rounded-2xl flex items-center justify-center mx-auto mb-4 relative">
                  <step.icon size={22} className="text-[#162C66]" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-[#F5C400] text-[#162C66] text-[11px] font-black rounded-full flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-[14px] font-bold text-[#0B1F44] mb-1">{step.title}</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
