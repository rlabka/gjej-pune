'use client';

import { useLocale } from 'next-intl';
import Card from '@/components/ui/Card';
import LoadingScreen from '@/components/ui/LoadingScreen';
import FeedbackToast from '@/app/[locale]/dashboard/job-seeker/_components/FeedbackToast';
import FeatureDisabled from '@/app/[locale]/dashboard/job-seeker/_components/FeatureDisabled';
import { getJobSeekerConfig } from '@/lib/siteConfig';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import {
  Loader2,
  Camera,
  Save,
  CheckCircle2,
  Circle,
  UserCog,
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// ─── Localization ────────────────────────────────────────

const PHONE_PREFIXES = [
  { code: '+41', flag: '🇨🇭', label: 'CH' },
  { code: '+49', flag: '🇩🇪', label: 'DE' },
  { code: '+43', flag: '🇦🇹', label: 'AT' },
  { code: '+33', flag: '🇫🇷', label: 'FR' },
  { code: '+39', flag: '🇮🇹', label: 'IT' },
  { code: '+355', flag: '🇦🇱', label: 'AL' },
  { code: '+383', flag: '🇽🇰', label: 'XK' },
  { code: '+389', flag: '🇲🇰', label: 'MK' },
  { code: '+44', flag: '🇬🇧', label: 'GB' },
  { code: '+1', flag: '🇺🇸', label: 'US' },
];

const loc = {
  de: {
    title: 'Mein Profil', subtitle: 'Dein Profil ist deine Visitenkarte — je vollständiger, desto besser wirst du von Arbeitgebern gefunden.',
    save: 'Änderungen speichern', saving: 'Speichern...', saved: 'Profil aktualisiert.',
    name: 'Anzeigename', email: 'E-Mail', phone: 'Telefon', location: 'Standort', website: 'Website',
    namePh: 'Dein Name', emailPh: 'name@example.com', phonePh: '79 123 45 67', locationPh: 'Stadt oder Region', websitePh: 'www.example.com',
    profileStatus: 'Profilstatus', profileHint: 'Vervollständigte Profile werden bis zu 3x häufiger von Top-Arbeitgebern gesehen.',
    cancel: 'Abbrechen', loading: 'Laden...',
    editInfo: 'Informationen bearbeiten', changePhoto: 'Foto ändern',
    checkName: 'Name hinzufügen', checkEmail: 'E-Mail bestätigen', checkPhone: 'Telefonnummer', checkLocation: 'Standort angeben', checkPhoto: 'Profilbild hochladen',
  },
  en: {
    title: 'My Profile', subtitle: 'Your profile is your first impression — the more complete it is, the better employers can find you.',
    save: 'Save changes', saving: 'Saving...', saved: 'Profile updated.',
    name: 'Display name', email: 'Email', phone: 'Phone', location: 'Location', website: 'Website',
    namePh: 'Your name', emailPh: 'name@example.com', phonePh: '79 123 45 67', locationPh: 'City or State', websitePh: 'www.example.com',
    profileStatus: 'Profile status', profileHint: 'Completed profiles are seen up to 3x more by top employers.',
    cancel: 'Cancel', loading: 'Loading...',
    editInfo: 'Edit information', changePhoto: 'Change photo',
    checkName: 'Add name', checkEmail: 'Confirm email', checkPhone: 'Phone number', checkLocation: 'Add location', checkPhoto: 'Upload photo',
  },
  fr: {
    title: 'Mon Profil', subtitle: 'Votre profil est votre carte de visite — plus il est complet, mieux les employeurs vous trouveront.',
    save: 'Enregistrer', saving: 'Enregistrement...', saved: 'Profil mis à jour.',
    name: 'Nom affiché', email: 'E-mail', phone: 'Téléphone', location: 'Lieu', website: 'Site web',
    namePh: 'Votre nom', emailPh: 'nom@example.com', phonePh: '79 123 45 67', locationPh: 'Ville ou région', websitePh: 'www.example.com',
    profileStatus: 'Statut du profil', profileHint: 'Les profils complets sont vus 3x plus par les meilleurs employeurs.',
    cancel: 'Annuler', loading: 'Chargement...',
    editInfo: 'Modifier les informations', changePhoto: 'Changer la photo',
    checkName: 'Ajouter un nom', checkEmail: 'Confirmer l\'e-mail', checkPhone: 'Numéro de téléphone', checkLocation: 'Ajouter un lieu', checkPhoto: 'Télécharger une photo',
  },
  it: {
    title: 'Il mio Profilo', subtitle: 'Il tuo profilo è il tuo biglietto da visita — più è completo, meglio i datori di lavoro ti troveranno.',
    save: 'Salva modifiche', saving: 'Salvataggio...', saved: 'Profilo aggiornato.',
    name: 'Nome visualizzato', email: 'E-mail', phone: 'Telefono', location: 'Luogo', website: 'Sito web',
    namePh: 'Il tuo nome', emailPh: 'nome@example.com', phonePh: '79 123 45 67', locationPh: 'Città o regione', websitePh: 'www.example.com',
    profileStatus: 'Stato del profilo', profileHint: 'I profili completi vengono visti 3x di più dai migliori datori di lavoro.',
    cancel: 'Annulla', loading: 'Caricamento...',
    editInfo: 'Modifica informazioni', changePhoto: 'Cambia foto',
    checkName: 'Aggiungi nome', checkEmail: 'Conferma e-mail', checkPhone: 'Numero di telefono', checkLocation: 'Aggiungi luogo', checkPhoto: 'Carica foto',
  },
  sq: {
    title: 'Profili im', subtitle: 'Profili juaj është karta juaj e vizitës — sa më i plotësuar, aq më mirë do t\'ju gjejnë punëdhënësit.',
    save: 'Ruaj ndryshimet', saving: 'Duke ruajtur...', saved: 'Profili u përditësua.',
    name: 'Emri i shfaqur', email: 'E-mail', phone: 'Telefoni', location: 'Vendndodhja', website: 'Faqja e internetit',
    namePh: 'Emri juaj', emailPh: 'emri@example.com', phonePh: '79 123 45 67', locationPh: 'Qyteti ose rajoni', websitePh: 'www.example.com',
    profileStatus: 'Statusi i profilit', profileHint: 'Profilet e plotësuara shihen 3x më shumë nga punëdhënësit kryesorë.',
    cancel: 'Anulo', loading: 'Duke ngarkuar...',
    editInfo: 'Ndrysho informacionet', changePhoto: 'Ndrysho foton',
    checkName: 'Shto emrin', checkEmail: 'Konfirmo e-mailin', checkPhone: 'Numri i telefonit', checkLocation: 'Shto vendndodhjen', checkPhoto: 'Ngarko foton',
  },
} as const;

// ─── Types ───────────────────────────────────────────────

interface Profile {
  id: string;
  displayName: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  experience: string;
  education: string;
  documents: string;
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────

const inputCls = 'w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-[14px] font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#162C66]/10 focus:border-[#162C66]/30 outline-none transition-all';

function calcCompletion(p: { displayName?: string | null; email?: string; phone?: string | null; location?: string | null; image?: string | null }): number {
  let score = 0, total = 5;
  if (p.displayName) score++;
  if (p.email) score++;
  if (p.phone) score++;
  if (p.location) score++;
  if (p.image) score++;
  return Math.round((score / total) * 100);
}

// ─── Component ───────────────────────────────────────────

export default function ProfilePage() {
  const locale = useLocale() as keyof typeof loc;
  const l = loc[locale] ?? loc.de;

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // Profile fields
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('+41');
  const [phone, setPhone] = useState('');
  const [profileLocation, setProfileLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  if (!getJobSeekerConfig().features.showProfile) {
    return <FeatureDisabled />;
  }

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(id);
  }, [toast]);

  // Load profile
  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    api.get<{ ok: boolean; profile: Profile }>('/api/settings/profile', token)
      .then((res) => {
        if (res.ok && res.profile) {
          const p = res.profile;
          setDisplayName(p.displayName || '');
          setEmail(p.email || '');
          // Extract prefix from stored phone number
          const storedPhone = p.phone || '';
          const prefixMatch = PHONE_PREFIXES.find(pr => storedPhone.startsWith(pr.code));
          if (prefixMatch) {
            setPhonePrefix(prefixMatch.code);
            setPhone(storedPhone.slice(prefixMatch.code.length).trim());
          } else {
            setPhone(storedPhone);
          }
          setProfileLocation(p.location || '');
          setWebsite(p.website || '');
          setImage(p.image || null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Save profile
  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const token = getToken();
      if (!token) return;
      const fullPhone = phone.trim() ? `${phonePrefix} ${phone.trim()}` : '';
      await api.put('/api/settings/profile', {
        displayName,
        email,
        phone: fullPhone,
        location: profileLocation,
        website,
      }, token);
      setToast(l.saved);
    } catch {
      setToast('Error saving profile');
    } finally {
      setIsSaving(false);
    }
  }, [displayName, email, phone, phonePrefix, profileLocation, website, isSaving, l.saved]);

  const profileCompletion = calcCompletion({ displayName, email, phone, location: profileLocation, image });
  const initials = (displayName || email || '?').charAt(0).toUpperCase();

  // Upload profile image
  const handleImageUpload = async (file: File) => {
    const token = getToken();
    if (!token) return;
    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.upload<{ ok: boolean; image: string }>('/api/settings/profile-image', fd, token);
      if (res.ok) {
        setImage(res.image);
        window.dispatchEvent(new Event('profile:imageUpdated'));
      }
    } catch {}
    setImageUploading(false);
  };

  if (loading) {
    return <LoadingScreen variant="section" />;
  }

  return (
    <>
      <FeedbackToast message={toast} onDismiss={() => setToast(null)} />

      {/* Premium Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#162C66] to-[#0B1F44] flex items-center justify-center shadow-lg shadow-[#162C66]/20 shrink-0">
          <UserCog size={22} className="text-[#F5C400]" />
        </div>
        <div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-[#0B1F44] tracking-tight">{l.title}</h2>
          <p className="text-sm text-slate-500 font-medium max-w-xl leading-relaxed mt-1">{l.subtitle}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-6 items-start">
        {/* Info Card */}
        <Card className="relative overflow-hidden w-full lg:flex-1">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#162C66]" />

          {/* Profile Header */}
          <div className="flex items-center gap-5 p-6 sm:p-7 pb-0">
            <label className="relative group cursor-pointer shrink-0">
              {image ? (
                <img src={image.startsWith('/uploads/') ? `${API_URL}${image}` : image} alt="" className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-md ring-2 ring-white" />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#162C66] text-white flex items-center justify-center font-bold text-2xl sm:text-3xl shadow-md ring-2 ring-white">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {imageUploading ? (
                  <Loader2 size={18} className="text-white animate-spin" />
                ) : (
                  <Camera size={18} className="text-white" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
              />
            </label>
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-[#0B1F44] truncate">{displayName || '—'}</h3>
              <p className="text-sm text-slate-500 truncate mt-0.5">{email || '—'}</p>
              <p className="text-[11px] text-[#162C66]/50 mt-1.5 cursor-pointer hover:text-[#162C66]/70 transition-colors">{l.changePhoto}</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="p-6 sm:p-7 pt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-[13px] font-semibold text-slate-700 mb-1.5">{l.name}</span>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={l.namePh} className={inputCls} />
              </label>
              <label className="block">
                <span className="block text-[13px] font-semibold text-slate-700 mb-1.5">{l.email}</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={l.emailPh} className={inputCls} />
              </label>
            </div>
            <div>
              <span className="block text-[13px] font-semibold text-slate-700 mb-1.5">{l.phone}</span>
              <div className="flex gap-2">
                <select
                  value={phonePrefix}
                  onChange={(e) => setPhonePrefix(e.target.value)}
                  className="w-[100px] shrink-0 px-2 py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-[13px] font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#162C66]/10 focus:border-[#162C66]/30 outline-none transition-all"
                >
                  {PHONE_PREFIXES.map((p) => (
                    <option key={p.code} value={p.code}>{p.flag} {p.code}</option>
                  ))}
                </select>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={l.phonePh} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="block text-[13px] font-semibold text-slate-700 mb-1.5">{l.location}</span>
                <LocationAutocomplete
                  value={profileLocation}
                  onChange={setProfileLocation}
                  onSelect={(s) => setProfileLocation(s.label)}
                  placeholder={l.locationPh}
                  inputClassName={inputCls}
                  requireSelection
                />
              </div>
              <label className="block">
                <span className="block text-[13px] font-semibold text-slate-700 mb-1.5">{l.website}</span>
                <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder={l.websitePh} className={inputCls} />
              </label>
            </div>

            <div className="pt-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full sm:w-auto sm:min-w-[220px] sm:float-right flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#F5C400] text-[#162C66] text-[14px] font-bold hover:bg-[#e6b800] active:scale-[0.98] disabled:opacity-60 transition-all shadow-sm"
              >
                {isSaving ? (
                  <><Loader2 size={16} className="animate-spin" /> {l.saving}</>
                ) : (
                  <><Save size={16} /> {l.save}</>
                )}
              </button>
              <div className="clear-both" />
            </div>
          </div>
        </Card>

        {/* Profile Completion Card */}
        <div className="w-full lg:w-[340px] shrink-0">
          <Card className="p-6 bg-[#162C66] text-white lg:sticky lg:top-6 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#F5C400]" />
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-white text-[15px]">{l.profileStatus}</h4>
              <span className="text-2xl font-extrabold text-[#F5C400]">{profileCompletion}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-5">
              <div
                className="h-full bg-[#F5C400] rounded-full transition-all duration-1000"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>

            {/* Checklist */}
            <div className="space-y-3 mb-5">
              {[
                { done: !!displayName, label: l.checkName },
                { done: !!email, label: l.checkEmail },
                { done: !!phone, label: l.checkPhone },
                { done: !!profileLocation, label: l.checkLocation },
                { done: !!image, label: l.checkPhoto },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  {item.done ? (
                    <CheckCircle2 size={14} className="text-[#F5C400] shrink-0" />
                  ) : (
                    <Circle size={14} className="text-white/30 shrink-0" />
                  )}
                  <span className={`text-[12px] font-medium ${item.done ? 'text-white/80 line-through decoration-white/30' : 'text-white/60'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[12px] font-medium text-white/40 leading-relaxed">{l.profileHint}</p>
          </Card>
        </div>
      </div>
    </>
  );
}

