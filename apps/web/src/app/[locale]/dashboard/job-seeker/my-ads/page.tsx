'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import FeedbackToast from '@/app/[locale]/dashboard/job-seeker/_components/FeedbackToast';
import { FileEdit, MapPin, Briefcase, Sparkles, Clock, ArrowLeft, Plus, Eye, Trash2, CheckCircle2, Lightbulb, Zap, User, Phone, Camera, ChevronDown, X, Globe, Pencil, ImagePlus, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { shortLocation } from '@/lib/location';
import { validateAdForm, getErrorMessage, type ValidationErrors } from '@/lib/validation';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import PhoneInput from '@/components/PhoneInput';
import JobCategoryAutocomplete from '@/components/JobCategoryAutocomplete';
import type { LocationSuggestion } from '@/hooks/useLocationAutocomplete';
import { useCategoryHelpers, type Locale } from '@/hooks/useCategories';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

type Ad = {
  id: string;
  category: string;
  firstName: string;
  surname: string;
  phone: string;
  email: string | null;
  age: number | null;
  experience: string | null;
  livingPlace: string | null;
  lat: number | null;
  lng: number | null;
  status: string;
  views: number;
  createdAt: string;
  photoUrl: string | null;
  skills: string[];
  spokenLanguages: string[];
};

const AVAILABLE_LANGUAGES = [
  { code: 'sq', flag: '🇦🇱' },
  { code: 'de', flag: '🇩🇪' },
  { code: 'en', flag: '🇬🇧' },
  { code: 'fr', flag: '🇫🇷' },
  { code: 'it', flag: '🇮🇹' },
  { code: 'el', flag: '🇬🇷' },
  { code: 'tr', flag: '🇹🇷' },
  { code: 'sr', flag: '🇷🇸' },
  { code: 'mk', flag: '🇲🇰' },
  { code: 'es', flag: '🇪🇸' },
  { code: 'pt', flag: '🇵🇹' },
  { code: 'ro', flag: '🇷🇴' },
  { code: 'pl', flag: '🇵🇱' },
  { code: 'nl', flag: '🇳🇱' },
  { code: 'ru', flag: '🇷🇺' },
  { code: 'ar', flag: '🇸🇦' },
] as const;

const langNames: Record<string, Record<string, string>> = {
  de: { sq: 'Albanisch', de: 'Deutsch', en: 'Englisch', fr: 'Französisch', it: 'Italienisch', el: 'Griechisch', tr: 'Türkisch', sr: 'Serbisch', mk: 'Mazedonisch', es: 'Spanisch', pt: 'Portugiesisch', ro: 'Rumänisch', pl: 'Polnisch', nl: 'Niederländisch', ru: 'Russisch', ar: 'Arabisch' },
  en: { sq: 'Albanian', de: 'German', en: 'English', fr: 'French', it: 'Italian', el: 'Greek', tr: 'Turkish', sr: 'Serbian', mk: 'Macedonian', es: 'Spanish', pt: 'Portuguese', ro: 'Romanian', pl: 'Polish', nl: 'Dutch', ru: 'Russian', ar: 'Arabic' },
  fr: { sq: 'Albanais', de: 'Allemand', en: 'Anglais', fr: 'Français', it: 'Italien', el: 'Grec', tr: 'Turc', sr: 'Serbe', mk: 'Macédonien', es: 'Espagnol', pt: 'Portugais', ro: 'Roumain', pl: 'Polonais', nl: 'Néerlandais', ru: 'Russe', ar: 'Arabe' },
  it: { sq: 'Albanese', de: 'Tedesco', en: 'Inglese', fr: 'Francese', it: 'Italiano', el: 'Greco', tr: 'Turco', sr: 'Serbo', mk: 'Macedone', es: 'Spagnolo', pt: 'Portoghese', ro: 'Rumeno', pl: 'Polacco', nl: 'Olandese', ru: 'Russo', ar: 'Arabo' },
  sq: { sq: 'Shqip', de: 'Gjermanisht', en: 'Anglisht', fr: 'Frëngjisht', it: 'Italisht', el: 'Greqisht', tr: 'Turqisht', sr: 'Serbisht', mk: 'Maqedonisht', es: 'Spanjisht', pt: 'Portugalisht', ro: 'Rumanisht', pl: 'Polonisht', nl: 'Holandisht', ru: 'Rusisht', ar: 'Arabisht' },
};

const loc = {
  de: {
    createProfile: 'Neues Jobprofil erstellen',
    whatJob: 'Welche Art von Job suchst du?',
    selectCategory: 'Jobkategorie auswählen...',
    yourInfo: 'Deine Informationen',
    name: 'Name', surname: 'Nachname', hidden: '(versteckt)', telNr: 'Tel. Nr.',
    age: 'Alter', agePlaceholder: 'Dein Alter',
    photo: 'Foto', uploadPhoto: 'Foto hochladen', photoRequired: 'Foto ist Pflicht',
    photoHint: 'Profile mit Foto erhalten oft mehr Nachrichten als solche ohne Foto.',
    photoFormats: 'Als PNG, JPG, GIF hochladen, minimal 640 x 640 oder jetzt Selfie machen.',
    photoGuideTitle: 'So klappt es mit Ihrem Bild',
    photoRules: [
      'Gut erkennbares Profilbild von Ihnen',
      'Positive Ausstrahlung & geeignete Kleidung',
      'Keine Kinder und zusätzliche Personen im Bild',
      'Keine Logos, Graphiken und Illustrationen',
      'Keine Telefonnummern und andere Kontaktdaten',
      'Gute Bildqualität',
    ],
    experience: 'Berufserfahrung', select: 'Auswählen...',
    livingPlace: 'Wohnort', livingPlacePh: 'Stadt oder Region',
    languages: 'Sprachkenntnisse', languagesHint: 'Welche Sprachen sprichst du? Wähle mindestens eine.',
    skills: 'Ich bin...', skillsHint: 'Wähle genau 3 Eigenschaften, die dich am besten beschreiben.',
    selected: 'ausgewählt',
    checklist: 'Profil-Checkliste', jobCategory: 'Jobkategorie', languagesMin: 'Sprache (min. 1)', skillsMax: 'Eigenschaften (3)',
    publishTitle: 'Profil veröffentlichen',
    publishDesc: 'Dein Profil wird für Arbeitgeber sichtbar, die nach Kandidaten suchen.',
    predefinedSkills: ['Kommunikativ','Geduldig','Verantwortungsbewusst','Professionell','Stressresistent','Empathisch','Teamfähig','Zuverlässig','Flexibel','Motiviert','Organisiert','Kreativ','Belastbar','Lösungsorientiert','Selbstständig','Freundlich','Sorgfältig','Engagiert','Hilfsbereit','Lernbereit'],
    experienceOpts: ['< 1 Jahr','1 Jahr','2 Jahre','3 Jahre','4 Jahre','5 Jahre','5+ Jahre','10+ Jahre'],
  },
  en: {
    createProfile: 'Create new Job Profile',
    whatJob: 'What kind of Job are you looking for?',
    selectCategory: 'Select a job category...',
    yourInfo: 'Your Information',
    name: 'Name', surname: 'Surname', hidden: '(hidden)', telNr: 'Tel. Nr.',
    age: 'Age', agePlaceholder: 'Your age',
    photo: 'Photo', uploadPhoto: 'Upload photo', photoRequired: 'Photo is required',
    photoHint: 'Profiles with a photo receive significantly more messages than those without.',
    photoFormats: 'Upload PNG, JPG, GIF, minimum 640 x 640 or take a selfie now.',
    photoGuideTitle: 'How to get your photo right',
    photoRules: [
      'Clearly recognizable profile picture of you',
      'Positive appearance & appropriate clothing',
      'No children or additional people in the picture',
      'No logos, graphics, or illustrations',
      'No phone numbers or other contact details',
      'Good image quality',
    ],
    experience: 'Years of Experience', select: 'Select...',
    livingPlace: 'Living Place', livingPlacePh: 'City or State',
    languages: 'Languages Spoken', languagesHint: 'Which languages do you speak? Select at least one.',
    skills: 'I am...', skillsHint: 'Choose exactly 3 traits that best describe you.',
    selected: 'selected',
    checklist: 'Profile Checklist', jobCategory: 'Job Category', languagesMin: 'Language (min. 1)', skillsMax: 'Traits (3)',
    publishTitle: 'Publish Profile',
    publishDesc: 'Your profile will be visible to employers searching for candidates.',
    predefinedSkills: ['Communicative','Patient','Responsible','Professional','Stress-resistant','Empathetic','Team-oriented','Reliable','Flexible','Motivated','Organized','Creative','Resilient','Solution-oriented','Independent','Friendly','Thorough','Committed','Helpful','Eager to learn'],
    experienceOpts: ['< 1 year','1 year','2 years','3 years','4 years','5 years','5+ years','10+ years'],
  },
  fr: {
    createProfile: 'Créer un nouveau profil emploi',
    whatJob: 'Quel type d\'emploi recherchez-vous ?',
    selectCategory: 'Sélectionner une catégorie...',
    yourInfo: 'Vos informations',
    name: 'Prénom', surname: 'Nom', hidden: '(caché)', telNr: 'Tél.',
    age: 'Âge', agePlaceholder: 'Votre âge',
    photo: 'Photo', uploadPhoto: 'Télécharger photo', photoRequired: 'Photo obligatoire',
    photoHint: 'Les profils avec photo reçoivent beaucoup plus de messages.',
    photoFormats: 'Téléchargez PNG, JPG, GIF, minimum 640 x 640 ou prenez un selfie.',
    photoGuideTitle: 'Comment réussir votre photo',
    photoRules: [
      'Photo de profil clairement reconnaissable de vous',
      'Apparence positive & tenue appropriée',
      'Pas d\'enfants ni d\'autres personnes sur l\'image',
      'Pas de logos, graphiques ou illustrations',
      'Pas de numéros de téléphone ni de coordonnées',
      'Bonne qualité d\'image',
    ],
    experience: 'Années d\'expérience', select: 'Sélectionner...',
    livingPlace: 'Lieu de résidence', livingPlacePh: 'Ville ou région',
    languages: 'Langues parlées', languagesHint: 'Quelles langues parlez-vous ? Sélectionnez au moins une.',
    skills: 'Je suis...', skillsHint: 'Choisissez exactement 3 qualités qui vous décrivent le mieux.',
    selected: 'sélectionné(s)',
    checklist: 'Checklist du profil', jobCategory: 'Catégorie d\'emploi', languagesMin: 'Langue (min. 1)', skillsMax: 'Qualités (3)',
    publishTitle: 'Publier le profil',
    publishDesc: 'Votre profil sera visible par les employeurs recherchant des candidats.',
    predefinedSkills: ['Communicatif','Patient','Responsable','Professionnel','Résistant au stress','Empathique','Esprit d\'équipe','Fiable','Flexible','Motivé','Organisé','Créatif','Endurant','Orienté solutions','Autonome','Aimable','Soigneux','Engagé','Serviable','Désireux d\'apprendre'],
    experienceOpts: ['< 1 an','1 an','2 ans','3 ans','4 ans','5 ans','5+ ans','10+ ans'],
  },
  it: {
    createProfile: 'Crea un nuovo profilo lavoro',
    whatJob: 'Che tipo di lavoro cerchi?',
    selectCategory: 'Seleziona una categoria...',
    yourInfo: 'Le tue informazioni',
    name: 'Nome', surname: 'Cognome', hidden: '(nascosto)', telNr: 'Tel.',
    age: 'Età', agePlaceholder: 'La tua età',
    photo: 'Foto', uploadPhoto: 'Carica foto', photoRequired: 'Foto obbligatoria',
    photoHint: 'I profili con foto ricevono molti più messaggi di quelli senza.',
    photoFormats: 'Carica PNG, JPG, GIF, minimo 640 x 640 o scatta un selfie.',
    photoGuideTitle: 'Come ottenere la foto giusta',
    photoRules: [
      'Foto del profilo chiaramente riconoscibile',
      'Aspetto positivo & abbigliamento adeguato',
      'Nessun bambino o persona aggiuntiva nell\'immagine',
      'Nessun logo, grafica o illustrazione',
      'Nessun numero di telefono o contatto',
      'Buona qualità dell\'immagine',
    ],
    experience: 'Anni di esperienza', select: 'Seleziona...',
    livingPlace: 'Luogo di residenza', livingPlacePh: 'Città o regione',
    languages: 'Lingue parlate', languagesHint: 'Quali lingue parli? Seleziona almeno una.',
    skills: 'Sono...', skillsHint: 'Scegli esattamente 3 qualità che ti descrivono meglio.',
    selected: 'selezionato/i',
    checklist: 'Checklist del profilo', jobCategory: 'Categoria lavoro', languagesMin: 'Lingua (min. 1)', skillsMax: 'Qualità (3)',
    publishTitle: 'Pubblica profilo',
    publishDesc: 'Il tuo profilo sarà visibile ai datori di lavoro che cercano candidati.',
    predefinedSkills: ['Comunicativo','Paziente','Responsabile','Professionale','Resistente allo stress','Empatico','Spirito di squadra','Affidabile','Flessibile','Motivato','Organizzato','Creativo','Resistente','Orientato alle soluzioni','Autonomo','Amichevole','Accurato','Impegnato','Disponibile','Desideroso di imparare'],
    experienceOpts: ['< 1 anno','1 anno','2 anni','3 anni','4 anni','5 anni','5+ anni','10+ anni'],
  },
  sq: {
    createProfile: 'Krijo një profil të ri pune',
    whatJob: 'Çfarë lloj pune kërkoni?',
    selectCategory: 'Zgjidhni një kategori...',
    yourInfo: 'Informacionet tuaja',
    name: 'Emri', surname: 'Mbiemri', hidden: '(i fshehur)', telNr: 'Tel.',
    age: 'Mosha', agePlaceholder: 'Mosha juaj',
    photo: 'Foto', uploadPhoto: 'Ngarko foto', photoRequired: 'Foto është e detyrueshme',
    photoHint: 'Profilet me foto marrin shumë më tepër mesazhe se ato pa foto.',
    photoFormats: 'Ngarko PNG, JPG, GIF, minimumi 640 x 640 ose bëj një selfie tani.',
    photoGuideTitle: 'Si ta bëni foton e duhur',
    photoRules: [
      'Foto profili e qartë dhe e njohshme e juaja',
      'Pamje pozitive & veshje e përshtatshme',
      'Pa fëmijë dhe persona shtesë në foto',
      'Pa logo, grafika apo ilustrime',
      'Pa numra telefoni apo të dhëna kontakti',
      'Cilësi e mirë e fotos',
    ],
    experience: 'Vitet e përvojës', select: 'Zgjidhni...',
    livingPlace: 'Vendbanimi', livingPlacePh: 'Qyteti ose rajoni',
    languages: 'Gjuhët e folura', languagesHint: 'Cilat gjuhë flisni? Zgjidhni të paktën një.',
    skills: 'Unë jam...', skillsHint: 'Zgjidhni saktësisht 3 cilësi që ju përshkruajnë më mirë.',
    selected: 'të zgjedhura',
    checklist: 'Lista e kontrollit', jobCategory: 'Kategoria e punës', languagesMin: 'Gjuha (min. 1)', skillsMax: 'Cilësitë (3)',
    publishTitle: 'Publiko profilin',
    publishDesc: 'Profili juaj do të jetë i dukshëm për punëdhënësit që kërkojnë kandidatë.',
    predefinedSkills: ['Komunikues','Durimtar','I përgjegjshëm','Profesional','Rezistent ndaj stresit','Empatik','Punues në grup','I besueshëm','Fleksibël','I motivuar','I organizuar','Kreativ','I qëndrueshëm','I orientuar nga zgjidhjet','I pavarur','Miqësor','I kujdesshëm','I angazhuar','Ndihmues','I gatshëm për të mësuar'],
    experienceOpts: ['< 1 vit','1 vit','2 vite','3 vite','4 vite','5 vite','5+ vite','10+ vite'],
  },
} as const;

export default function MyAdsPage() {
  const locale = useLocale() as keyof typeof loc;
  const l = loc[locale] ?? loc.de;
  const { translateTitle } = useCategoryHelpers();
  const t = useTranslations('CreateAd');
  const feedbackT = useTranslations('jobSeeker.feedback');

  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<'list' | 'create'>(searchParams.get('create') === '1' ? 'create' : 'list');
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Create form fields
  const [jobCategory, setJobCategory] = useState('');
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [telNr, setTelNr] = useState('');
  const [ageField, setAgeField] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [livingPlace, setLivingPlace] = useState('');
  const [livingLat, setLivingLat] = useState<number | null>(null);
  const [livingLng, setLivingLng] = useState<number | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});

  // Preserve form data across locale changes
  const FORM_STORAGE_KEY = 'myads-form-draft';

  useEffect(() => {
    const saved = sessionStorage.getItem(FORM_STORAGE_KEY);
    if (saved) {
      try {
        const d = JSON.parse(saved);
        if (Date.now() - d._ts < 30000) {
          setView(d.view || 'list');
          if (d.jobCategory) setJobCategory(d.jobCategory);
          if (d.firstName) setFirstName(d.firstName);
          if (d.surname) setSurname(d.surname);
          if (d.telNr) setTelNr(d.telNr);
          if (d.ageField) setAgeField(d.ageField);
          if (d.yearsExperience) setYearsExperience(d.yearsExperience);
          if (d.livingPlace) setLivingPlace(d.livingPlace);
          if (d.livingLat != null) setLivingLat(d.livingLat);
          if (d.livingLng != null) setLivingLng(d.livingLng);
          if (d.selectedSkills?.length) setSelectedSkills(d.selectedSkills);
          if (d.selectedLanguages?.length) setSelectedLanguages(d.selectedLanguages);
          if (d.photoPreview) setPhotoPreview(d.photoPreview);
        }
      } catch {}
      sessionStorage.removeItem(FORM_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const saveForm = () => {
      if (view !== 'create') return;
      sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify({
        _ts: Date.now(), view, jobCategory, firstName, surname, telNr, ageField,
        yearsExperience, livingPlace, livingLat, livingLng, selectedSkills, selectedLanguages, photoPreview,
      }));
    };
    window.addEventListener('locale-change', saveForm);
    return () => window.removeEventListener('locale-change', saveForm);
  }, [view, jobCategory, firstName, surname, telNr, ageField, yearsExperience, livingPlace, livingLat, livingLng, selectedSkills, selectedLanguages, photoPreview]);

  // Load ads from backend
  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    api.get<{ ok: boolean; ads: Ad[] }>('/api/ads/mine', token)
      .then((res) => { if (res.ok) setAds(res.ads); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) => {
      if (prev.includes(skill)) return prev.filter((s) => s !== skill);
      if (prev.length >= 3) return prev;
      return [...prev, skill];
    });
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const startEdit = (ad: Ad) => {
    setEditingAd(ad);
    setJobCategory(ad.category);
    setFirstName(ad.firstName);
    setSurname(ad.surname);
    setTelNr(ad.phone);
    setAgeField(ad.age ? String(ad.age) : '');
    setYearsExperience(ad.experience || '');
    setLivingPlace(ad.livingPlace || '');
    setLivingLat(ad.lat);
    setLivingLng(ad.lng);
    setSelectedSkills(ad.skills || []);
    setSelectedLanguages(Array.isArray(ad.spokenLanguages) ? ad.spokenLanguages : []);
    setPhotoPreview(ad.photoUrl ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${ad.photoUrl}` : null);
    setFieldErrors({});
    setView('create');
  };

  const resetForm = () => {
    setEditingAd(null);
    setJobCategory(''); setFirstName(''); setSurname(''); setTelNr(''); setAgeField('');
    setYearsExperience(''); setLivingPlace(''); setLivingLat(null); setLivingLng(null); setSelectedSkills([]); setSelectedLanguages([]);
    setPhotoPreview(null); setPhotoFile(null);
    setFieldErrors({});
  };

  const deleteAd = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    setConfirmDeleteId(null);
    try {
      const token = getToken();
      const res = await api.delete<{ ok: boolean }>(`/api/ads/${id}`, token || undefined);
      if (res.ok) {
        setAds((prev) => prev.filter((a) => a.id !== id));
        setToast(t('deletedToast'));
      }
    } catch { /* ignore */ }
    setDeletingId(null);
  };

  const onPublish = async () => {
    if (isPublishing) return;

    const errors = validateAdForm({
      category: jobCategory,
      firstName,
      surname,
      phone: telNr,
      age: ageField || undefined,
      livingPlace: livingPlace || undefined,
      experience: yearsExperience || undefined,
    });
    // Photo is required
    if (!photoPreview && !photoFile) errors.photo = 'required';
    // Skills: exactly 3 required
    if (selectedSkills.length !== 3) errors.skills = 'required';
    if (selectedLanguages.length === 0) errors.spokenLanguages = 'required';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsPublishing(true);
    try {
      // Location must be selected from autocomplete (lat/lng already set)
      const finalLat = livingLat;
      const finalLng = livingLng;
      const resolvedPlace = livingPlace.trim();

      const token = getToken();
      const body = {
        category: jobCategory,
        firstName,
        surname,
        phone: telNr,
        age: ageField ? Number(ageField) : undefined,
        experience: yearsExperience || undefined,
        livingPlace: resolvedPlace || undefined,
        lat: finalLat ?? undefined,
        lng: finalLng ?? undefined,
        skills: selectedSkills,
        spokenLanguages: selectedLanguages,
      };

      let res: { ok: boolean; ad: Ad; error?: string; details?: { field: string; message: string }[] };

      if (editingAd) {
        res = await api.put<typeof res>(`/api/ads/${editingAd.id}`, body, token || undefined);
      } else {
        res = await api.post<typeof res>('/api/ads', body, token || undefined);
      }

      if (res.ok) {
        let finalAd = res.ad;

        // Upload photo if selected
        if (photoFile) {
          const formData = new FormData();
          formData.append('photo', photoFile);
          const photoRes = await api.upload<{ ok: boolean; photoUrl: string }>(`/api/ads/${res.ad.id}/photo`, formData, token || undefined);
          if (photoRes.ok) {
            finalAd = { ...finalAd, photoUrl: photoRes.photoUrl };
          }
        }

        if (editingAd) {
          setAds((prev) => prev.map((a) => a.id === editingAd.id ? finalAd : a));
          setToast(t('updatedToast') || 'Anzeige aktualisiert');
          resetForm();
          setView('list');
        } else {
          setToast(t('successToast'));
          resetForm();
          setTimeout(() => router.push('/dashboard/job-seeker'), 1200);
        }
      } else if (res.error === 'validationError' && res.details) {
        const serverErrors: ValidationErrors = {};
        for (const d of res.details) serverErrors[d.field] = d.message;
        setFieldErrors(serverErrors);
      } else {
        setToast('Error saving profile');
      }
    } catch {
      setToast('Error saving profile');
    } finally {
      setIsPublishing(false);
    }
  };

  const inputCls = "w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50/80 border border-slate-200/80 rounded-lg sm:rounded-xl text-[14px] sm:text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#162C66]/10 focus:border-[#162C66]/30 outline-none transition-all";
  const inputErrorCls = "w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-red-50/50 border border-red-300 rounded-lg sm:rounded-xl text-[14px] sm:text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none transition-all";

  /* =================== LIST VIEW =================== */
  if (view === 'list') {
    return (
      <>
        <FeedbackToast message={toast} onDismiss={() => setToast(null)} />

        {/* Delete Confirmation Dialog */}
        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Trash2 size={22} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-[#0B1F44] text-center mb-2">{t('deleteConfirmTitle')}</h3>
              <p className="text-sm text-slate-500 text-center mb-6">{t('deleteConfirmDesc')}</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 h-11 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  {t('deleteConfirmNo')}
                </button>
                <button
                  type="button"
                  onClick={() => deleteAd(confirmDeleteId)}
                  className="flex-1 h-11 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all"
                >
                  {t('deleteConfirmYes')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-[#162C66]/[0.06] rounded-xl flex items-center justify-center">
              <FileEdit size={20} className="text-[#162C66]" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-[#0B1F44] tracking-tight">{t('title')}</h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">{t('subtitle')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { resetForm(); setView('create'); }}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-[#162C66] text-white text-[13px] sm:text-sm font-bold rounded-xl hover:bg-[#0F1E45] transition-all shadow-sm"
          >
            <Plus size={16} />
            {l.createProfile}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* Left: Ad list */}
          <div className="lg:col-span-2">
            {ads.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {ads.map((ad) => (
                  <div
                    key={ad.id}
                    className="group bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all overflow-hidden"
                  >
                    <div className="p-4 sm:p-6">
                      {/* Header: title + status */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {ad.photoUrl ? (
                            <img src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${ad.photoUrl}`} alt={ad.firstName} className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl object-cover border-2 border-slate-100 shrink-0" />
                          ) : (
                            <div className="w-10 h-10 sm:w-16 sm:h-16 bg-gradient-to-br from-[#162C66] to-[#0F1E45] rounded-xl sm:rounded-2xl flex items-center justify-center text-white text-sm sm:text-lg font-bold shrink-0">
                              {translateTitle(ad.category, locale as Locale).charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="text-sm sm:text-lg font-extrabold text-[#0B1F44] leading-snug truncate">{translateTitle(ad.category, locale as Locale)}</h3>
                            <p className="text-[12px] sm:text-sm text-slate-500 font-medium mt-0.5 truncate">{ad.firstName} {ad.surname}</p>
                          </div>
                        </div>
                        <span className={clsx(
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold shrink-0',
                          ad.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                        )}>
                          <span className={clsx('w-1.5 h-1.5 rounded-full', ad.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400')} />
                          {ad.status === 'Active' ? t('statusActive') : t('statusDraft')}
                        </span>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {ad.experience && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 rounded-lg text-emerald-700 text-[11px] sm:text-[13px] font-bold border border-emerald-100">
                            <Clock size={11} className="text-emerald-500" />
                            {ad.experience}
                          </span>
                        )}
                        {ad.livingPlace && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-[11px] sm:text-[13px] font-bold rounded-lg border border-amber-100">
                            <MapPin size={11} className="text-amber-500" />{shortLocation(ad.livingPlace)}
                          </span>
                        )}
                        {ad.skills && ad.skills.map((skill) => (
                          <span key={skill} className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-violet-50 text-violet-700 text-[13px] font-bold rounded-lg border border-violet-100">
                            <Sparkles size={11} className="text-violet-400" />{skill}
                          </span>
                        ))}
                        {Array.isArray(ad.spokenLanguages) && ad.spokenLanguages.length > 0 && (
                          <div className="hidden sm:flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                              <Globe size={12} className="text-sky-600" />
                            </div>
                            <div className="flex items-center gap-1 flex-wrap">
                              {ad.spokenLanguages.map((lang) => (
                                <span
                                  key={lang}
                                  title={langNames[locale]?.[lang] || lang}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-[12px] font-medium text-slate-600 rounded-md"
                                >
                                  <span className="text-[13px] leading-none">{AVAILABLE_LANGUAGES.find((l) => l.code === lang)?.flag || '🌐'}</span>
                                  {langNames[locale]?.[lang] || lang}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer: views + actions */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100/80">
                        <span className="text-[11px] sm:text-xs font-medium text-slate-400 flex items-center gap-1.5">
                          <Eye size={12} />
                          {ad.views} {t('views')}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => startEdit(ad)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#162C66] hover:bg-[#162C66]/5 transition-all"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(ad.id)}
                            disabled={deletingId === ad.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-8 sm:p-12 text-center">
                <div className="w-14 h-14 bg-[#162C66]/[0.06] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileEdit size={28} className="text-[#162C66]" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#0B1F44] mb-2">{t('emptyTitle')}</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">{t('emptyDesc')}</p>
                <button
                  type="button"
                  onClick={() => { resetForm(); setView('create'); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#162C66] text-white text-sm font-bold rounded-xl hover:bg-[#0F1E45] transition-all shadow-sm"
                >
                  <Plus size={16} />
                  {l.createProfile}
                </button>
              </div>
            )}
          </div>

          {/* Right: Tips & Info sidebar */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Lightbulb size={16} className="text-amber-600" />
                </div>
                <h4 className="font-bold text-[#0B1F44] text-sm">{t('tipsTitle')}</h4>
              </div>
              <div className="space-y-2.5">
                {[t('tip1'), t('tip2'), t('tip3'), t('tip4')].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 bg-emerald-50 rounded-md flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                    </span>
                    <span className="text-[13px] font-medium text-slate-600 leading-snug">{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#162C66] to-[#0F1E45] p-5 sm:p-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#F5C400]/15 to-transparent rounded-full -translate-y-1/2 translate-x-1/4" />
              <div className="relative z-10">
                <div className="w-10 h-10 bg-[#F5C400] rounded-xl flex items-center justify-center text-[#162C66] mb-4 shadow-lg shadow-[#F5C400]/20">
                  <Zap size={20} fill="currentColor" />
                </div>
                <h4 className="text-white font-bold text-base mb-2">{t('howItWorksTitle')}</h4>
                <p className="text-white/50 text-[13px] font-medium leading-relaxed mb-4">{t('howItWorksDesc')}</p>
                <div className="space-y-3">
                  {[t('step1'), t('step2'), t('step3')].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center text-[11px] font-bold text-[#F5C400] shrink-0">{i + 1}</span>
                      <span className="text-[13px] font-medium text-white/70 leading-snug">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* =================== CREATE VIEW =================== */
  return (
    <>
      <FeedbackToast message={toast} onDismiss={() => setToast(null)} />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => { resetForm(); setView('list'); }}
            className="group flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#162C66] transition-colors shrink-0"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">{t('backToList')}</span>
          </button>
          <span className="hidden sm:block w-px h-5 bg-slate-200" />
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-[#0B1F44] tracking-tight">
              {editingAd ? (t('editProfile') || 'Profil bearbeiten') : l.createProfile}
            </h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-5">

          {/* Job Category (replaces "Desired Job Title") */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-2.5 mb-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Briefcase size={14} className="sm:hidden text-amber-600" />
                <Briefcase size={16} className="hidden sm:block text-amber-600" />
              </div>
              <span className="text-[13px] sm:text-[14px] font-bold text-[#0B1F44]">{l.whatJob} <span className="text-red-500">*</span></span>
            </div>
            <JobCategoryAutocomplete
              value={jobCategory}
              onChange={(key) => { setJobCategory(key); setFieldErrors((p) => { const { category, ...r } = p; return r; }); }}
              locale={locale}
              placeholder={l.selectCategory}
              className={inputCls}
              errorClassName={inputErrorCls}
              hasError={!!fieldErrors.category}
            />
            {fieldErrors.category && <p className="text-xs text-red-500 font-medium mt-1">{getErrorMessage(fieldErrors.category, locale)}</p>}
          </div>

          {/* Personal Information (replaces "About me") */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-2.5 mb-5 sm:mb-6">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#162C66]/[0.06] flex items-center justify-center shrink-0">
                <User size={14} className="sm:hidden text-[#162C66]" />
                <User size={16} className="hidden sm:block text-[#162C66]" />
              </div>
              <span className="text-[13px] sm:text-[14px] font-bold text-[#0B1F44]">{l.yourInfo}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Name */}
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">
                  {l.name} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); setFieldErrors((p) => { const { firstName: _, ...r } = p; return r; }); }}
                  placeholder={l.name}
                  className={fieldErrors.firstName ? inputErrorCls : inputCls}
                />
                {fieldErrors.firstName && <p className="text-[11px] sm:text-xs text-red-500 font-medium mt-1">{getErrorMessage(fieldErrors.firstName, locale)}</p>}
              </div>

              {/* Surname (Hidden label) */}
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">
                  {l.surname} <span className="text-red-500">*</span>
                  <span className="ml-1 sm:ml-1.5 text-[9px] sm:text-[10px] font-medium text-slate-400 normal-case">{l.hidden}</span>
                </label>
                <input
                  type="text"
                  value={surname}
                  onChange={(e) => { setSurname(e.target.value); setFieldErrors((p) => { const { surname: _, ...r } = p; return r; }); }}
                  placeholder={l.surname}
                  className={fieldErrors.surname ? inputErrorCls : inputCls}
                />
                {fieldErrors.surname && <p className="text-[11px] sm:text-xs text-red-500 font-medium mt-1">{getErrorMessage(fieldErrors.surname, locale)}</p>}
              </div>

              {/* Tel. Nr. (Hidden, required) */}
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">
                  <Phone size={11} className="sm:hidden inline mr-0.5" />
                  <Phone size={12} className="hidden sm:inline mr-1" />
                  {l.telNr} <span className="text-red-500">*</span>
                  <span className="ml-1 sm:ml-1.5 text-[9px] sm:text-[10px] font-medium text-slate-400 normal-case">{l.hidden}</span>
                </label>
                <PhoneInput value={telNr} onChange={(val) => { setTelNr(val); setFieldErrors((p) => { const { phone: _, ...r } = p; return r; }); }} placeholder="79 123 45 67" className={inputCls} errorClassName={inputErrorCls} hasError={!!fieldErrors.phone} />
                {fieldErrors.phone && <p className="text-[11px] sm:text-xs text-red-500 font-medium mt-1">{getErrorMessage(fieldErrors.phone, locale)}</p>}
              </div>

              {/* Age */}
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">
                  {l.age} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={ageField}
                  onChange={(e) => { const v = e.target.value; if (v === '' || /^\d{0,2}$/.test(v)) { setAgeField(v); setFieldErrors((p) => { const { age: _, ...r } = p; return r; }); } }}
                  placeholder={l.agePlaceholder}
                  className={fieldErrors.age ? inputErrorCls : inputCls}
                />
                {fieldErrors.age && <p className="text-[11px] sm:text-xs text-red-500 font-medium mt-1">{getErrorMessage(fieldErrors.age, locale)}</p>}
              </div>

              {/* Years of Experience */}
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">
                  {l.experience} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={yearsExperience}
                    onChange={(e) => { setYearsExperience(e.target.value); setFieldErrors((p) => { const { experience: _, ...r } = p; return r; }); }}
                    className={clsx(fieldErrors.experience ? inputErrorCls : inputCls, 'appearance-none pr-10')}
                  >
                    <option value="" disabled>{l.select}</option>
                    {l.experienceOpts.map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="sm:hidden absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <ChevronDown size={18} className="hidden sm:block absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                {fieldErrors.experience && <p className="text-[11px] sm:text-xs text-red-500 font-medium mt-1">{getErrorMessage(fieldErrors.experience, locale)}</p>}
              </div>

              {/* Living Place (Hidden) */}
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">
                  <Globe size={11} className="sm:hidden inline mr-0.5" />
                  <Globe size={12} className="hidden sm:inline mr-1" />
                  {l.livingPlace} <span className="text-red-500">*</span>
                  <span className="ml-1 sm:ml-1.5 text-[9px] sm:text-[10px] font-medium text-slate-400 normal-case">{l.hidden}</span>
                </label>
                <LocationAutocomplete
                  value={livingPlace}
                  onChange={(val) => { setLivingPlace(val); setLivingLat(null); setLivingLng(null); setFieldErrors((p) => { const { livingPlace: _, ...r } = p; return r; }); }}
                  onSelect={(s: LocationSuggestion) => { setLivingPlace(s.label); setLivingLat(s.lat); setLivingLng(s.lng); setFieldErrors((p) => { const { livingPlace: _, ...r } = p; return r; }); }}
                  placeholder={l.livingPlacePh}
                  iconSize={16}
                  iconClassName="text-slate-400 left-3.5"
                  inputClassName={fieldErrors.livingPlace ? inputErrorCls : inputCls}
                  requireSelection
                />
                {fieldErrors.livingPlace && <p className="text-[11px] sm:text-xs text-red-500 font-medium mt-1">{getErrorMessage(fieldErrors.livingPlace, locale)}</p>}
              </div>
            </div>
          </div>

          {/* Foto — combined upload + guidelines section */}
          <div className="rounded-xl sm:rounded-2xl bg-white border border-slate-200/60 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="p-4 sm:p-6 lg:p-7">
              <h3 className="text-lg sm:text-xl font-bold text-[#0B1F44] mb-5">{l.photo}</h3>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-6 lg:gap-8">
                {/* Left: Upload area */}
                <div className="flex flex-col gap-5">
                  <div className={clsx(
                    'relative rounded-2xl border-2 border-dashed p-5 transition-colors',
                    fieldErrors.photo ? 'bg-red-50/40 border-red-300' : 'bg-[#F5C400]/[0.04] border-[#F5C400]/40 hover:border-[#F5C400]/70'
                  )}>
                    <div className="flex items-start gap-4">
                      <div className={clsx(
                        'w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 border',
                        photoPreview ? 'border-[#F5C400]/30' : fieldErrors.photo ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'
                      )}>
                        {photoPreview ? (
                          <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImagePlus size={24} className={fieldErrors.photo ? 'text-red-300' : 'text-slate-300'} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] sm:text-[14px] font-semibold text-[#0B1F44] leading-snug mb-1">
                          {l.photoHint}
                        </p>
                        <p className="text-[11px] sm:text-[12px] text-slate-400 leading-relaxed mb-3">
                          {l.photoFormats}
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => { handlePhotoSelect(e); setFieldErrors((p) => { const { photo: _, ...r } = p; return r; }); }}
                          />
                          <button
                            type="button"
                            className="px-5 py-2.5 bg-[#F5C400] text-[#0B1F44] text-[13px] font-bold rounded-xl hover:bg-[#e5b800] transition-colors shadow-sm shadow-[#F5C400]/20"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            {l.uploadPhoto}
                          </button>
                          {photoPreview && (
                            <button
                              type="button"
                              className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                              onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    {fieldErrors.photo && <p className="text-xs text-red-500 font-medium mt-3">{getErrorMessage('photoRequired', locale)}</p>}
                  </div>
                </div>

                {/* Right: Guide title + example images + rules */}
                <div>
                  <h4 className="text-[15px] sm:text-[17px] font-bold text-[#0B1F44] mb-4">
                    {l.photoGuideTitle}
                  </h4>
                  <img
                    src="/images/photo-guide.png"
                    alt={l.photoGuideTitle}
                    className="w-full max-w-[380px] rounded-xl mb-5"
                  />
                  <ul className="space-y-2.5">
                    {l.photoRules.map((rule: string, i: number) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-md bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                          <Check size={12} className="text-emerald-500" strokeWidth={2.5} />
                        </div>
                        <span className="text-[12px] sm:text-[13px] text-slate-600 leading-snug font-medium">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Spoken Languages – multi-select, at least 1 required */}
          <div className={clsx(
            'bg-white rounded-xl sm:rounded-2xl border shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 sm:p-6',
            fieldErrors.spokenLanguages ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200/60'
          )}>
            <div className="flex items-center justify-between mb-1 gap-2">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
                  <Globe size={14} className="sm:hidden text-sky-600" />
                  <Globe size={16} className="hidden sm:block text-sky-600" />
                </div>
                <span className="text-[13px] sm:text-[14px] font-bold text-[#0B1F44] truncate">{l.languages} <span className="text-red-500">*</span></span>
              </div>
              <span className={clsx(
                'text-[11px] sm:text-[12px] font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg tabular-nums transition-all shrink-0',
                selectedLanguages.length >= 1
                  ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60'
                  : 'bg-slate-50 text-slate-400 ring-1 ring-slate-200/60'
              )}>
                {selectedLanguages.length} {l.selected}
              </span>
            </div>
            <p className="text-[11px] sm:text-[12px] text-slate-400 mb-4 sm:mb-5 ml-9 sm:ml-[42px]">{l.languagesHint}</p>

            {/* Selected languages preview */}
            {selectedLanguages.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-slate-100">
                {selectedLanguages.map((code) => {
                  const lang = AVAILABLE_LANGUAGES.find((la) => la.code === code);
                  const name = langNames[locale]?.[code] || langNames.en[code] || code;
                  return (
                    <span
                      key={code}
                      className="inline-flex items-center gap-1 sm:gap-1.5 pl-2 sm:pl-2.5 pr-1 sm:pr-1.5 py-0.5 sm:py-1 bg-sky-50 text-sky-700 text-[11px] sm:text-[12px] font-semibold rounded-lg border border-sky-100"
                    >
                      {lang?.flag} {name}
                      <button
                        type="button"
                        onClick={() => { setSelectedLanguages((prev) => prev.filter((c) => c !== code)); }}
                        className="w-4 h-4 rounded-md hover:bg-sky-200/60 flex items-center justify-center transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-1.5 sm:gap-2">
              {AVAILABLE_LANGUAGES.map(({ code, flag }) => {
                const isSelected = selectedLanguages.includes(code);
                const name = langNames[locale]?.[code] || langNames.en[code] || code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      setSelectedLanguages((prev) =>
                        prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
                      );
                      setFieldErrors((p) => { const { spokenLanguages: _, ...r } = p; return r; });
                    }}
                    className={clsx(
                      'group relative flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[12px] sm:text-[13px] font-semibold border transition-all duration-150',
                      isSelected
                        ? 'bg-gradient-to-r from-[#162C66] to-[#1E3A80] text-white border-[#162C66] shadow-[0_2px_8px_rgba(22,44,102,0.25)]'
                        : 'bg-white text-slate-600 border-slate-200/80 hover:border-[#162C66]/30 hover:bg-[#162C66]/[0.03] hover:shadow-sm'
                    )}
                  >
                    <span className="text-sm sm:text-base leading-none shrink-0">{flag}</span>
                    <span className="truncate flex-1 text-left">{name}</span>
                    {isSelected && (
                      <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-white/20 flex items-center justify-center shrink-0">
                        <Check size={10} className="sm:hidden text-white" />
                        <Check size={12} className="hidden sm:block text-white" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {fieldErrors.spokenLanguages && <p className="text-[11px] sm:text-xs text-red-500 font-medium mt-2 sm:mt-3">{locale === 'de' ? 'Mindestens eine Sprache auswählen' : locale === 'fr' ? 'Sélectionnez au moins une langue' : locale === 'it' ? 'Seleziona almeno una lingua' : locale === 'sq' ? 'Zgjidhni të paktën një gjuhë' : 'Select at least one language'}</p>}
          </div>

          {/* Skills – 20 predefined adjectives, exactly 3 required */}
          <div className={clsx(
            'bg-white rounded-xl sm:rounded-2xl border shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 sm:p-6',
            fieldErrors.skills ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200/60'
          )}>
            <div className="flex items-center justify-between mb-1 gap-2">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                  <Sparkles size={14} className="sm:hidden text-violet-600" />
                  <Sparkles size={16} className="hidden sm:block text-violet-600" />
                </div>
                <span className="text-[13px] sm:text-[14px] font-bold text-[#0B1F44] truncate">{l.skills} <span className="text-red-500">*</span></span>
              </div>
              <span className={clsx(
                'text-[11px] sm:text-[12px] font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg tabular-nums transition-all shrink-0',
                selectedSkills.length === 3
                  ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60'
                  : 'bg-slate-50 text-slate-400 ring-1 ring-slate-200/60'
              )}>
                {selectedSkills.length}/3 {l.selected}
              </span>
            </div>
            <p className="text-[11px] sm:text-[12px] text-slate-400 mb-4 sm:mb-5 ml-9 sm:ml-[42px]">{l.skillsHint}</p>

            {/* Selected skills preview */}
            {selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-slate-100">
                {selectedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 sm:gap-1.5 pl-2 sm:pl-2.5 pr-1 sm:pr-1.5 py-0.5 sm:py-1 bg-violet-50 text-violet-700 text-[11px] sm:text-[12px] font-semibold rounded-lg border border-violet-100"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => { toggleSkill(skill); }}
                      className="w-4 h-4 rounded-md hover:bg-violet-200/60 flex items-center justify-center transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {l.predefinedSkills.map((skill: string) => {
                const isSelected = selectedSkills.includes(skill);
                const isDisabled = !isSelected && selectedSkills.length >= 3;
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => { toggleSkill(skill); setFieldErrors((p) => { const { skills: _, ...r } = p; return r; }); }}
                    disabled={isDisabled}
                    className={clsx(
                      'inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[12px] sm:text-[13px] font-semibold border transition-all duration-150',
                      isSelected
                        ? 'bg-gradient-to-r from-violet-600 to-violet-700 text-white border-violet-600 shadow-[0_2px_8px_rgba(124,58,237,0.25)]'
                        : isDisabled
                        ? 'bg-slate-50/80 text-slate-300 border-slate-100 cursor-not-allowed opacity-50'
                        : 'bg-white text-slate-600 border-slate-200/80 hover:border-violet-300 hover:bg-violet-50/40 hover:shadow-sm'
                    )}
                  >
                    {isSelected && (
                      <span className="w-4 h-4 sm:w-[18px] sm:h-[18px] rounded-md bg-white/20 flex items-center justify-center shrink-0">
                        <Check size={10} className="sm:hidden text-white" />
                        <Check size={11} className="hidden sm:block text-white" />
                      </span>
                    )}
                    {skill}
                  </button>
                );
              })}
            </div>
            {fieldErrors.skills && <p className="text-[11px] sm:text-xs text-red-500 font-medium mt-2 sm:mt-3">{getErrorMessage('skillsRequired', locale)}</p>}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-5">
          {/* Required Fields Summary */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 sm:p-6">
            <h4 className="font-bold text-[#0B1F44] text-sm mb-3">{l.checklist}</h4>
            <div className="space-y-2">
              {[
                { label: l.jobCategory, done: !!jobCategory },
                { label: l.name, done: !!firstName.trim() },
                { label: l.surname, done: !!surname.trim() },
                { label: l.telNr, done: !!telNr.trim() },
                { label: l.age, done: !!ageField && Number(ageField) >= 16 && Number(ageField) <= 99 },
                { label: l.photo, done: !!(photoPreview || photoFile) },
                { label: l.livingPlace, done: !!livingPlace.trim() && livingLat !== null },
                { label: l.experience, done: !!yearsExperience },
                { label: l.languagesMin, done: selectedLanguages.length >= 1 },
                { label: l.skillsMax, done: selectedSkills.length === 3 },
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
          </div>

          {/* Publish Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#162C66] to-[#0F1E45] p-5 sm:p-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#F5C400]/15 to-transparent rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="relative z-10">
              <div className="w-10 h-10 bg-[#F5C400] rounded-xl flex items-center justify-center text-[#162C66] mb-4 shadow-lg shadow-[#F5C400]/20">
                <FileEdit size={20} />
              </div>
              <h4 className="text-white font-bold text-base sm:text-lg mb-2">
                {editingAd ? (t('saveChanges') || 'Änderungen speichern') : t('publish')}
              </h4>
              <p className="text-white/50 text-[13px] font-medium leading-relaxed mb-5">{l.publishDesc}</p>
              <button
                type="button"
                onClick={onPublish}
                disabled={isPublishing || !jobCategory || !firstName.trim() || !surname.trim() || !telNr.trim() || !ageField || !livingPlace.trim() || livingLat === null || !yearsExperience || !(photoPreview || photoFile) || selectedLanguages.length === 0 || selectedSkills.length !== 3}
                className="w-full flex items-center justify-center gap-2 h-11 bg-[#F5C400] text-[#162C66] text-sm font-bold rounded-xl hover:bg-[#e6b800] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#F5C400]/20"
              >
                {isPublishing ? feedbackT('loading.saving') : editingAd ? (t('saveChanges') || 'Änderungen speichern') : t('publish')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
