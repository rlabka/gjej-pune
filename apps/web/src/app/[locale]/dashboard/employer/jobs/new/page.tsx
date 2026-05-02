'use client';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Briefcase, MapPin, DollarSign, User, Phone, Mail, Building2, Clock, ChevronDown, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import CurrencySelect from '@/components/CurrencySelect';
import PhoneInput from '@/components/PhoneInput';
import JobCategoryAutocomplete from '@/components/JobCategoryAutocomplete';
import type { LocationSuggestion } from '@/hooks/useLocationAutocomplete';
import FeedbackToast from '@/app/[locale]/dashboard/job-seeker/_components/FeedbackToast';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { validateJobForm, getErrorMessage, type ValidationErrors } from '@/lib/validation';
import { type Locale } from '@jmp/shared';

export const dynamic = 'force-dynamic';

const loc = {
  de: {
    title: 'Neues Stellenangebot erstellen', subtitle: 'Füllen Sie die Details aus, um Ihr Stellenangebot zu veröffentlichen',
    jobCategory: 'Jobtitel / Kategorie', selectCategory: 'Jobkategorie auswählen...',
    contactInfo: 'Kontaktinformationen',
    name: 'Name', surname: 'Nachname', hidden: '(versteckt)', telNr: 'Tel. Nr.',
    companyName: 'Firmenname', companyHidden: '(versteckt, optional)',
    namePh: 'Kontaktname', surnamePh: 'Kontakt-Nachname', companyPh: 'Ihr Firmenname',
    salary: 'Gehalt', salaryPh: 'z.B. 25', provisionPh: 'z.B. 10',
    salaryTypes: ['Stunde', 'Monat', 'Jahr', 'Provision'],
    currency: 'Währung',
    location: 'Standort', state: 'Kanton', city: 'Stadt',
    statePh: 'z.B. Zürich', cityPh: 'z.B. Winterthur',
    when: 'Starttermin', whenOptions: ['Dringend', 'Verhandlung'],
    checklist: 'Stellenangebot-Checkliste',
    publishTitle: 'Stellenangebot veröffentlichen',
    publishDesc: 'Ihr Stellenangebot wird für Kandidaten sichtbar, die Arbeit suchen.',
    publishBtn: 'Stellenangebot veröffentlichen', publishing: 'Veröffentlichen...',
    successToast: 'Stellenangebot erfolgreich veröffentlicht!',
  },
  en: {
    title: 'Create a new Job Offer', subtitle: 'Fill in the details to publish your job offer',
    jobCategory: 'Job Title / Category', selectCategory: 'Select a job category...',
    contactInfo: 'Contact Information',
    name: 'Name', surname: 'Surname', hidden: '(hidden)', telNr: 'Tel. Nr.',
    companyName: 'Company Name', companyHidden: '(hidden, optional)',
    namePh: 'Contact name', surnamePh: 'Contact surname', companyPh: 'Your company name',
    salary: 'Salary', salaryPh: 'e.g. 25', provisionPh: 'e.g. 10',
    salaryTypes: ['Hour', 'Month', 'Year', 'Provision'],
    currency: 'Currency',
    location: 'Location', state: 'State / Canton', city: 'City',
    statePh: 'e.g. Zürich', cityPh: 'e.g. Winterthur',
    when: 'Start date', whenOptions: ['Urgent', 'Negotiation'],
    checklist: 'Job Offer Checklist',
    publishTitle: 'Publish Job Offer',
    publishDesc: 'Your job offer will be visible to candidates searching for work.',
    publishBtn: 'Publish Job Offer', publishing: 'Publishing...',
    successToast: 'Job offer published successfully!',
  },
  fr: {
    title: 'Créer une offre d\'emploi', subtitle: 'Remplissez les détails pour publier votre offre',
    jobCategory: 'Titre / Catégorie', selectCategory: 'Sélectionner une catégorie...',
    contactInfo: 'Informations de contact',
    name: 'Prénom', surname: 'Nom', hidden: '(caché)', telNr: 'Tél.',
    companyName: 'Nom de l\'entreprise', companyHidden: '(caché, optionnel)',
    namePh: 'Nom du contact', surnamePh: 'Prénom du contact', companyPh: 'Nom de votre entreprise',
    salary: 'Salaire', salaryPh: 'ex. 25', provisionPh: 'ex. 10',
    salaryTypes: ['Heure', 'Mois', 'Année', 'Provision'],
    currency: 'Devise',
    location: 'Lieu', state: 'Canton', city: 'Ville',
    statePh: 'ex. Zürich', cityPh: 'ex. Winterthur',
    when: 'Début', whenOptions: ['Urgent', 'Négociation'],
    checklist: 'Checklist de l\'offre',
    publishTitle: 'Publier l\'offre d\'emploi',
    publishDesc: 'Votre offre sera visible par les candidats à la recherche d\'un emploi.',
    publishBtn: 'Publier l\'offre', publishing: 'Publication...',
    successToast: 'Offre d\'emploi publiée avec succès !',
  },
  it: {
    title: 'Crea una nuova offerta di lavoro', subtitle: 'Compila i dettagli per pubblicare la tua offerta',
    jobCategory: 'Titolo / Categoria', selectCategory: 'Seleziona una categoria...',
    contactInfo: 'Informazioni di contatto',
    name: 'Nome', surname: 'Cognome', hidden: '(nascosto)', telNr: 'Tel.',
    companyName: 'Nome azienda', companyHidden: '(nascosto, opzionale)',
    namePh: 'Nome contatto', surnamePh: 'Cognome contatto', companyPh: 'Nome della tua azienda',
    salary: 'Stipendio', salaryPh: 'es. 25', provisionPh: 'es. 10',
    salaryTypes: ['Ora', 'Mese', 'Anno', 'Provvigione'],
    currency: 'Valuta',
    location: 'Luogo', state: 'Cantone', city: 'Città',
    statePh: 'es. Zürigo', cityPh: 'es. Winterthur',
    when: 'Inizio', whenOptions: ['Urgente', 'Negoziazione'],
    checklist: 'Checklist dell\'offerta',
    publishTitle: 'Pubblica offerta di lavoro',
    publishDesc: 'La tua offerta sarà visibile ai candidati in cerca di lavoro.',
    publishBtn: 'Pubblica offerta', publishing: 'Pubblicazione...',
    successToast: 'Offerta di lavoro pubblicata con successo!',
  },
  sq: {
    title: 'Krijo një ofertë të re pune', subtitle: 'Plotësoni detajet për të publikuar ofertën tuaj',
    jobCategory: 'Titulli / Kategoria', selectCategory: 'Zgjidhni një kategori...',
    contactInfo: 'Informacionet e kontaktit',
    name: 'Emri', surname: 'Mbiemri', hidden: '(i fshehur)', telNr: 'Tel.',
    companyName: 'Emri i kompanisë', companyHidden: '(i fshehur, opsional)',
    namePh: 'Emri i kontaktit', surnamePh: 'Mbiemri i kontaktit', companyPh: 'Emri i kompanisë suaj',
    salary: 'Paga', salaryPh: 'p.sh. 25', provisionPh: 'p.sh. 10',
    salaryTypes: ['Orë', 'Muaj', 'Vit', 'Provision'],
    currency: 'Monedha',
    location: 'Vendndodhja', state: 'Kantoni', city: 'Qyteti',
    statePh: 'p.sh. Zürich', cityPh: 'p.sh. Winterthur',
    when: 'Fillimi', whenOptions: ['Urgjente', 'Negociatë'],
    checklist: 'Lista e kontrollit',
    publishTitle: 'Publiko ofertën e punës',
    publishDesc: 'Oferta juaj do të jetë e dukshme për kandidatët që kërkojnë punë.',
    publishBtn: 'Publiko ofertën', publishing: 'Duke publikuar...',
    successToast: 'Oferta e punës u publikua me sukses!',
  },
} as const;

export default function NewJobPage() {
  const locale = useLocale() as keyof typeof loc;
  const t = loc[locale] ?? loc.de;
  const [toast, setToast] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const [jobCategory, setJobCategory] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactSurname, setContactSurname] = useState('');
  const [salary, setSalary] = useState('');
  const [salaryType, setSalaryType] = useState('Hour');
  const [currency, setCurrency] = useState('EUR');
  const [telNr, setTelNr] = useState('');
  const [firmaName, setFirmaName] = useState('');
  const [locationState, setLocationState] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [whenOption, setWhenOption] = useState('');

  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});
  const router = useRouter();
  const locationInputRef = useRef<string>('');

  // Preserve form data across locale changes
  const FORM_STORAGE_KEY = 'newjob-form-draft';

  useEffect(() => {
    const saved = sessionStorage.getItem(FORM_STORAGE_KEY);
    if (saved) {
      try {
        const d = JSON.parse(saved);
        if (Date.now() - d._ts < 30000) {
          if (d.jobCategory) setJobCategory(d.jobCategory);
          if (d.contactName) setContactName(d.contactName);
          if (d.contactSurname) setContactSurname(d.contactSurname);
          if (d.salary) setSalary(d.salary);
          if (d.salaryType) setSalaryType(d.salaryType);
          if (d.currency) setCurrency(d.currency);
          if (d.telNr) setTelNr(d.telNr);
          if (d.firmaName) setFirmaName(d.firmaName);
          if (d.locationState) setLocationState(d.locationState);
          if (d.locationCity) setLocationCity(d.locationCity);
          if (d.locationLat != null) setLocationLat(d.locationLat);
          if (d.locationLng != null) setLocationLng(d.locationLng);
          if (d.whenOption) setWhenOption(d.whenOption);
        }
      } catch {}
      sessionStorage.removeItem(FORM_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const saveForm = () => {
      sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify({
        _ts: Date.now(), jobCategory, contactName, contactSurname, salary, salaryType, currency,
        telNr, firmaName, locationState, locationCity, locationLat, locationLng, whenOption,
      }));
    };
    window.addEventListener('locale-change', saveForm);
    return () => window.removeEventListener('locale-change', saveForm);
  }, [jobCategory, contactName, contactSurname, salary, salaryType, currency, telNr, firmaName, locationState, locationCity, locationLat, locationLng, whenOption]);

  const inputCls = 'w-full px-4 py-3 bg-slate-50/80 border border-slate-200/80 rounded-xl text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#162C66]/10 focus:border-[#162C66]/30 outline-none transition-all';
  const inputErrorCls = 'w-full px-4 py-3 bg-red-50/50 border border-red-300 rounded-xl text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none transition-all';

  const canPublish = jobCategory && contactName.trim() && contactSurname.trim() && telNr.trim() && salary.trim() && (locationCity.trim() || locationState.trim()) && locationLat !== null && whenOption;

  const onPublish = async () => {
    if (isPublishing) return;

    // If user typed/autofilled without selecting from dropdown, parse city/state from raw input
    let finalCity = locationCity;
    let finalState = locationState;
    if (!finalState && finalCity) {
      const parts = finalCity.split(',').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        finalCity = parts[0];
        finalState = parts[1];
        setLocationCity(finalCity);
        setLocationState(finalState);
      } else {
        // Single value — use as both
        finalState = finalCity;
        setLocationState(finalState);
      }
    }

    const errors = validateJobForm({
      category: jobCategory,
      contactName,
      contactSurname,
      contactPhone: telNr,
      salary: salary || undefined,
      locationState: finalState,
      locationCity: finalCity,
      when: whenOption,
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsPublishing(true);
    try {
      const token = getToken();
      const res = await api.post<{ ok: boolean; error?: string; details?: { field: string; message: string }[] }>('/api/jobs', {
        category: jobCategory,
        contactName,
        contactSurname,
        contactPhone: telNr,
        companyName: firmaName || undefined,
        salary: salary ? parseFloat(salary) : undefined,
        salaryType,
        currency: salaryType === 'Provision' ? undefined : currency,
        locationState: finalState,
        locationCity: finalCity,
        lat: locationLat ?? undefined,
        lng: locationLng ?? undefined,
        when: whenOption,
      }, token || undefined);
      if (res.ok) {
        setToast(t.successToast);
        setFieldErrors({});
        setTimeout(() => router.push('/dashboard/employer'), 1200);
      } else if (res.error === 'validationError' && res.details) {
        const serverErrors: ValidationErrors = {};
        for (const d of res.details) serverErrors[d.field] = d.message;
        setFieldErrors(serverErrors);
      } else {
        setToast('Error creating job');
      }
    } catch {
      setToast('Error creating job');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <FeedbackToast message={toast} onDismiss={() => setToast(null)} />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 bg-[#162C66]/[0.06] rounded-xl flex items-center justify-center">
            <Briefcase size={22} className="text-[#162C66]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B1F44] tracking-tight">{t.title}</h1>
            <p className="text-sm text-slate-500 font-medium">{t.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        {/* Main Form */}
        <div className="space-y-6">

          {/* Job Title / Category */}
          <Card className="p-5 sm:p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Briefcase size={16} className="text-amber-600" />
              </div>
              <span className="text-[14px] font-bold text-[#0B1F44]">{t.jobCategory} <span className="text-red-500">*</span></span>
            </div>
            <JobCategoryAutocomplete
              value={jobCategory}
              onChange={(key) => { setJobCategory(key); setFieldErrors((p) => { const { category, ...r } = p; return r; }); }}
              locale={locale}
              placeholder={t.selectCategory}
              className={inputCls}
              errorClassName={inputErrorCls}
              hasError={!!fieldErrors.category}
            />
            {fieldErrors.category && <p className="text-xs text-red-500 font-medium mt-1">{getErrorMessage(fieldErrors.category, locale)}</p>}
          </Card>

          {/* Contact Person Info */}
          <Card className="p-5 sm:p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-[#162C66]/[0.06] flex items-center justify-center shrink-0">
                <User size={16} className="text-[#162C66]" />
              </div>
              <span className="text-[14px] font-bold text-[#0B1F44]">{t.contactInfo}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Name */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">
                  <User size={11} className="text-slate-400" />
                  {t.name} <span className="text-red-500">*</span>
                  <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 normal-case">{t.hidden}</span>
                </label>
                <input type="text" value={contactName} onChange={(e) => { setContactName(e.target.value); setFieldErrors((p) => { const { contactName: _, ...r } = p; return r; }); }} placeholder={t.namePh} className={fieldErrors.contactName ? inputErrorCls : inputCls} />
                {fieldErrors.contactName && <p className="text-[11px] sm:text-xs text-red-500 font-medium mt-1">{getErrorMessage(fieldErrors.contactName, locale)}</p>}
              </div>
              {/* Surname */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">
                  <User size={11} className="text-slate-400" />
                  {t.surname} <span className="text-red-500">*</span>
                  <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 normal-case">{t.hidden}</span>
                </label>
                <input type="text" value={contactSurname} onChange={(e) => { setContactSurname(e.target.value); setFieldErrors((p) => { const { contactSurname: _, ...r } = p; return r; }); }} placeholder={t.surnamePh} className={fieldErrors.contactSurname ? inputErrorCls : inputCls} />
                {fieldErrors.contactSurname && <p className="text-[11px] sm:text-xs text-red-500 font-medium mt-1">{getErrorMessage(fieldErrors.contactSurname, locale)}</p>}
              </div>
              {/* Tel. Nr. */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">
                  <Phone size={11} className="text-slate-400" />
                  {t.telNr} <span className="text-red-500">*</span>
                  <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 normal-case">{t.hidden}</span>
                </label>
                <PhoneInput value={telNr} onChange={(val) => { setTelNr(val); setFieldErrors((p) => { const { contactPhone: _, ...r } = p; return r; }); }} placeholder="79 123 45 67" className={inputCls} errorClassName={inputErrorCls} hasError={!!fieldErrors.contactPhone} />
                {fieldErrors.contactPhone && <p className="text-[11px] sm:text-xs text-red-500 font-medium mt-1">{getErrorMessage(fieldErrors.contactPhone, locale)}</p>}
              </div>
              {/* Firma Name */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">
                  <Building2 size={11} className="text-slate-400" />
                  {t.companyName}
                  <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 normal-case">{t.companyHidden}</span>
                </label>
                <input type="text" value={firmaName} onChange={(e) => setFirmaName(e.target.value)} placeholder={t.companyPh} className={inputCls} />
              </div>
            </div>
          </Card>

          {/* Salary */}
          <Card className="p-5 sm:p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <DollarSign size={16} className="text-emerald-600" />
              </div>
              <span className="text-[14px] font-bold text-[#0B1F44]">{t.salary} <span className="text-red-500">*</span></span>
            </div>

            {/* Salary type buttons */}
            <div className="flex flex-wrap rounded-xl border border-slate-200/80 overflow-hidden bg-slate-50/80 mb-4">
              {t.salaryTypes.map((st: string, idx: number) => {
                const val = ['Hour', 'Month', 'Year', 'Provision'][idx];
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => { setSalaryType(val); if (val === 'Provision') setSalary(''); }}
                    className={clsx(
                      'flex-1 min-w-0 px-3 sm:px-4 py-3 text-[12px] sm:text-[13px] font-semibold transition-all',
                      salaryType === val
                        ? 'bg-[#162C66] text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    {st}
                  </button>
                );
              })}
            </div>

            {/* Amount + Currency row */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={salary}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (salaryType === 'Provision') {
                      if (v === '' || (/^\d*\.?\d*$/.test(v) && (v === '' || parseFloat(v) <= 100))) setSalary(v);
                    } else {
                      if (v === '' || /^\d*\.?\d*$/.test(v)) setSalary(v);
                    }
                  }}
                  placeholder={salaryType === 'Provision' ? (t.provisionPh as string) : (t.salaryPh as string)}
                  className={clsx(fieldErrors.salary ? inputErrorCls : inputCls, salaryType === 'Provision' && 'pr-10')}
                />
                {salaryType === 'Provision' && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[15px] font-bold text-slate-400 pointer-events-none">%</span>
                )}
              </div>
              {salaryType !== 'Provision' && (
                <CurrencySelect value={currency} onChange={setCurrency} locale={locale} />
              )}
            </div>
            {fieldErrors.salary && <p className="text-xs text-red-500 font-medium mt-1">{getErrorMessage(fieldErrors.salary, locale)}</p>}
          </Card>

          {/* Location */}
          <Card className="p-5 sm:p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <MapPin size={16} className="text-blue-600" />
              </div>
              <span className="text-[14px] font-bold text-[#0B1F44]">{t.location} <span className="text-red-500">*</span></span>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{locale === 'de' ? 'Stadt oder Region' : locale === 'fr' ? 'Ville ou région' : locale === 'it' ? 'Città o regione' : locale === 'sq' ? 'Qyteti ose rajoni' : 'City or Region'} <span className="text-red-500">*</span></label>
              <LocationAutocomplete
                value={locationCity ? `${locationCity}${locationState ? `, ${locationState}` : ''}` : ''}
                onChange={(val) => {
                  setLocationCity(val);
                  setLocationLat(null);
                  setLocationLng(null);
                  setFieldErrors((p) => { const { locationCity: _, locationState: _2, ...r } = p; return r; });
                }}
                onSelect={(s: LocationSuggestion) => {
                  setLocationCity(s.city);
                  setLocationState(s.state || s.country);
                  setLocationLat(s.lat);
                  setLocationLng(s.lng);
                  setFieldErrors((p) => { const { locationCity: _, locationState: _2, ...r } = p; return r; });
                }}
                placeholder={`${t.cityPh}, ${t.statePh}`}
                iconSize={16}
                iconClassName="text-slate-400 left-3.5"
                inputClassName={(fieldErrors.locationCity || fieldErrors.locationState) ? inputErrorCls : inputCls}
                requireSelection
              />
              {(fieldErrors.locationCity || fieldErrors.locationState) && <p className="text-xs text-red-500 font-medium mt-1">{getErrorMessage(fieldErrors.locationCity || fieldErrors.locationState || '', locale)}</p>}
            </div>
          </Card>

          {/* When? */}
          <Card className="p-5 sm:p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                <Clock size={16} className="text-violet-600" />
              </div>
              <span className="text-[14px] font-bold text-[#0B1F44]">{t.when} <span className="text-red-500">*</span></span>
            </div>
            <div className="flex gap-3">
              {t.whenOptions.map((label: string, idx: number) => {
                const val = ['Urgent', 'Negotiation'][idx];
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => { setWhenOption(val); setFieldErrors((p) => { const { when: _, ...r } = p; return r; }); }}
                    className={clsx(
                      'flex-1 px-4 py-3.5 rounded-xl text-[14px] font-semibold border-2 transition-all',
                      whenOption === val
                        ? 'bg-[#162C66] text-white border-[#162C66] shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {/* Checklist */}
          <Card className="p-5 sm:p-6 border border-slate-200 shadow-sm">
            <h4 className="font-bold text-[#0B1F44] text-sm mb-3">{t.checklist}</h4>
            <div className="space-y-2">
              {[
                { label: t.jobCategory, done: !!jobCategory },
                { label: t.name, done: !!contactName.trim() },
                { label: t.surname, done: !!contactSurname.trim() },
                { label: t.telNr, done: !!telNr.trim() },
                { label: t.salary, done: !!salary.trim() },
                { label: t.location, done: !!(locationCity.trim() || locationState.trim()) && locationLat !== null },
                { label: t.when, done: !!whenOption },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className={clsx(
                    'w-5 h-5 rounded-md flex items-center justify-center shrink-0',
                    item.done ? 'bg-emerald-100' : 'bg-slate-100'
                  )}>
                    <CheckCircle2 size={12} className={item.done ? 'text-emerald-600' : 'text-slate-300'} />
                  </div>
                  <span className={clsx('text-[13px] font-medium', item.done ? 'text-slate-700' : 'text-slate-400')}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Publish */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#162C66] to-[#0F1E45] p-5 sm:p-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#F5C400]/15 to-transparent rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="relative z-10">
              <div className="w-10 h-10 bg-[#F5C400] rounded-xl flex items-center justify-center text-[#162C66] mb-4 shadow-lg shadow-[#F5C400]/20">
                <Briefcase size={20} />
              </div>
              <h4 className="text-white font-bold text-base sm:text-lg mb-2">{t.publishTitle}</h4>
              <p className="text-white/50 text-[13px] font-medium leading-relaxed mb-5">{t.publishDesc}</p>
              <button
                type="button"
                onClick={onPublish}
                disabled={isPublishing || !canPublish}
                className="w-full flex items-center justify-center gap-2 h-11 bg-[#F5C400] text-[#162C66] text-sm font-bold rounded-xl hover:bg-[#e6b800] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#F5C400]/20"
              >
                {isPublishing ? t.publishing : t.publishBtn}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
