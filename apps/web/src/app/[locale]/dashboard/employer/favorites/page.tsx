'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { shortLocation } from '@/lib/location';
import { Heart, Search, MapPin, MessageSquare, Share2, X, Copy, Briefcase, Eye, Award, Sparkles, ArrowRight, HeartOff, Globe } from 'lucide-react';
import { SkeletonList } from '@/components/ui/LoadingScreen';
import { FaWhatsapp, FaFacebook } from 'react-icons/fa';
import { clsx } from 'clsx';
import { useFavorites } from '@/hooks/useFavorites';
import { buildShareUrl, shareWhatsApp, shareFacebook, copyLink } from '@/lib/share';
import Button from '@/components/ui/Button';
import FeedbackToast from '@/app/[locale]/dashboard/job-seeker/_components/FeedbackToast';
import { useCategoryHelpers, type Locale } from '@/hooks/useCategories';

export const dynamic = 'force-dynamic';

const LANG_FLAGS: Record<string, string> = { sq: '🇦🇱', de: '🇩🇪', en: '🇬🇧', fr: '🇫🇷', it: '🇮🇹', el: '🇬🇷', tr: '🇹🇷', sr: '🇷🇸', mk: '🇲🇰', es: '🇪🇸', pt: '🇵🇹', ro: '🇷🇴', pl: '🇵🇱', nl: '🇳🇱', ru: '🇷🇺', ar: '🇸🇦' };
const LANG_NAMES: Record<string, Record<string, string>> = {
  de: { sq: 'Albanisch', de: 'Deutsch', en: 'Englisch', fr: 'Französisch', it: 'Italienisch', el: 'Griechisch', tr: 'Türkisch', sr: 'Serbisch', mk: 'Mazedonisch', es: 'Spanisch', pt: 'Portugiesisch', ro: 'Rumänisch', pl: 'Polnisch', nl: 'Niederländisch', ru: 'Russisch', ar: 'Arabisch' },
  en: { sq: 'Albanian', de: 'German', en: 'English', fr: 'French', it: 'Italian', el: 'Greek', tr: 'Turkish', sr: 'Serbian', mk: 'Macedonian', es: 'Spanish', pt: 'Portuguese', ro: 'Romanian', pl: 'Polish', nl: 'Dutch', ru: 'Russian', ar: 'Arabic' },
  fr: { sq: 'Albanais', de: 'Allemand', en: 'Anglais', fr: 'Français', it: 'Italien', el: 'Grec', tr: 'Turc', sr: 'Serbe', mk: 'Macédonien', es: 'Espagnol', pt: 'Portugais', ro: 'Roumain', pl: 'Polonais', nl: 'Néerlandais', ru: 'Russe', ar: 'Arabe' },
  it: { sq: 'Albanese', de: 'Tedesco', en: 'Inglese', fr: 'Francese', it: 'Italiano', el: 'Greco', tr: 'Turco', sr: 'Serbo', mk: 'Macedone', es: 'Spagnolo', pt: 'Portoghese', ro: 'Rumeno', pl: 'Polacco', nl: 'Olandese', ru: 'Russo', ar: 'Arabo' },
  sq: { sq: 'Shqip', de: 'Gjermanisht', en: 'Anglisht', fr: 'Frëngjisht', it: 'Italisht', el: 'Greqisht', tr: 'Turqisht', sr: 'Serbisht', mk: 'Maqedonisht', es: 'Spanjisht', pt: 'Portugalisht', ro: 'Rumanisht', pl: 'Polonisht', nl: 'Holandisht', ru: 'Rusisht', ar: 'Arabisht' },
};

interface BackendAd {
  id: string;
  userId: string;
  category: string;
  firstName: string;
  surname: string;
  phone: string;
  email: string | null;
  photoUrl: string | null;
  experience: string | null;
  livingPlace: string | null;
  skills: string[];
  spokenLanguages: string[];
  status: string;
  views: number;
  createdAt: string;
  user?: { displayName: string | null };
}

type Candidate = {
  id: string;
  userId: string;
  firstName: string;
  photo: string;
  profession: string;
  experience: string;
  skills: string[];
  spokenLanguages: string[];
  location: string;
  phone: string;
  email: string;
};

function mapBackendAd(ad: BackendAd, locale: string = 'sq', translateTitle: (slug: string, locale: Locale) => string): Candidate {
  return {
    id: ad.id,
    userId: ad.userId,
    firstName: ad.firstName,
    photo: ad.photoUrl
      ? (ad.photoUrl.startsWith('http') ? ad.photoUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${ad.photoUrl}`)
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(ad.firstName)}&background=162C66&color=fff&size=150`,
    profession: translateTitle(ad.category, locale as Locale),
    experience: ad.experience || '',
    skills: Array.isArray(ad.skills) ? ad.skills : [],
    spokenLanguages: Array.isArray(ad.spokenLanguages) ? ad.spokenLanguages : [],
    location: shortLocation(ad.livingPlace),
    phone: ad.phone,
    email: ad.email || '',
  };
}

const loc = {
  de: {
    title: 'Favorisierte Kandidaten', subtitle: 'Ihre gespeicherten Kandidatenprofile',
    noCandidates: 'Noch keine Favoriten', noCandidatesHint: 'Kandidaten, die Sie als Favoriten markieren, erscheinen hier',
    experience: 'Erfahrung', skills: 'Fähigkeiten', languages: 'Sprachen', showMore: 'Mehr anzeigen',
    contact: (name: string) => `${name} kontaktieren`, contactSent: 'Kontaktanfrage gesendet!',
    remove: 'Aus Favoriten entfernen', saved: 'Gespeichert', shareWith: 'Mit einem Freund teilen',
    sharedWa: 'Über WhatsApp geteilt!', sharedFb: 'Auf Facebook geteilt!', linkCopied: 'Link kopiert!',
    removed: 'Kandidat aus Favoriten entfernt', browseCandidates: 'Kandidaten suchen',
    found: (n: number) => `${n} favorisierte Kandidaten`,
  },
  en: {
    title: 'Favorite Candidates', subtitle: 'Your saved candidate profiles',
    noCandidates: 'No favorites yet', noCandidatesHint: 'Candidates you mark as favorites will appear here',
    experience: 'Experience', skills: 'Skills', languages: 'Languages', showMore: 'Show more',
    contact: (name: string) => `Contact ${name}`, contactSent: 'Contact request sent!',
    remove: 'Remove from favorites', saved: 'Saved', shareWith: 'Share with a friend',
    sharedWa: 'Shared via WhatsApp!', sharedFb: 'Shared on Facebook!', linkCopied: 'Link copied!',
    removed: 'Candidate removed from favorites', browseCandidates: 'Browse candidates',
    found: (n: number) => `${n} favorite candidates`,
  },
  fr: {
    title: 'Candidats favoris', subtitle: 'Vos profils de candidats enregistrés',
    noCandidates: 'Aucun favori', noCandidatesHint: 'Les candidats que vous marquez comme favoris apparaîtront ici',
    experience: 'Expérience', skills: 'Compétences', languages: 'Langues', showMore: 'Voir plus',
    contact: (name: string) => `Contacter ${name}`, contactSent: 'Demande de contact envoyée !',
    remove: 'Retirer des favoris', saved: 'Enregistré', shareWith: 'Partager avec un ami',
    sharedWa: 'Partagé via WhatsApp !', sharedFb: 'Partagé sur Facebook !', linkCopied: 'Lien copié !',
    removed: 'Candidat retiré des favoris', browseCandidates: 'Parcourir les candidats',
    found: (n: number) => `${n} candidats favoris`,
  },
  it: {
    title: 'Candidati preferiti', subtitle: 'I tuoi profili di candidati salvati',
    noCandidates: 'Nessun preferito', noCandidatesHint: 'I candidati che segni come preferiti appariranno qui',
    experience: 'Esperienza', skills: 'Competenze', languages: 'Lingue', showMore: 'Mostra di più',
    contact: (name: string) => `Contatta ${name}`, contactSent: 'Richiesta di contatto inviata!',
    remove: 'Rimuovi dai preferiti', saved: 'Salvato', shareWith: 'Condividi con un amico',
    sharedWa: 'Condiviso via WhatsApp!', sharedFb: 'Condiviso su Facebook!', linkCopied: 'Link copiato!',
    removed: 'Candidato rimosso dai preferiti', browseCandidates: 'Cerca candidati',
    found: (n: number) => `${n} candidati preferiti`,
  },
  sq: {
    title: 'Kandidatët e preferuar', subtitle: 'Profilet tuaja të kandidatëve të ruajtura',
    noCandidates: 'Asnjë preferenc ende', noCandidatesHint: 'Kandidatët që i shënoni si preferenc do të shfaqen këtu',
    experience: 'Përvoja', skills: 'Aftësitë', languages: 'Gjuhët', showMore: 'Shfaq më shumë',
    contact: (name: string) => `Kontaktoni ${name}`, contactSent: 'Kërkesa për kontakt u dërgua!',
    remove: 'Hiq nga preferencat', saved: 'Ruajtur', shareWith: 'Ndaj me një mik',
    sharedWa: 'Ndarë përmes WhatsApp!', sharedFb: 'Ndarë në Facebook!', linkCopied: 'Linku u kopjua!',
    removed: 'Kandidati u hoq nga preferencat', browseCandidates: 'Kërko kandidatë',
    found: (n: number) => `${n} kandidatë të preferuar`,
  },
} as const;

export default function FavoriteCandidatesPage() {
  const locale = useLocale() as keyof typeof loc;
  const t = loc[locale] ?? loc.de;
  const { translateTitle } = useCategoryHelpers();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const { isFavorited, toggleFavorite: toggleFav, trackShare } = useFavorites();
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showShareMenu, setShowShareMenu] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fetchFavorites = useCallback(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    setLoading(true);
    api.get<{ ok: boolean; ads: BackendAd[] }>('/api/favorites/saved-ads', token)
      .then((res) => {
        if (res.ok) {
          setCandidates(res.ads.map((ad) => mapBackendAd(ad, locale, translateTitle)));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [locale, translateTitle]);

  useEffect(() => { fetchFavorites(); }, [fetchFavorites]);

  const openCandidateDetail = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    const token = getToken() || undefined;
    api.get<{ ok: boolean }>(`/api/ads/${candidate.id}`, token).catch(() => {});
  };

  const handleRemoveFavorite = async (id: string) => {
    await toggleFav('ad', id);
    setCandidates((prev) => prev.filter((c) => c.id !== id));
    if (selectedCandidate?.id === id) {
      setSelectedCandidate(null);
      setShowShareMenu(null);
    }
    setToast(t.removed);
  };

  return (
    <>
      <FeedbackToast message={toast} onDismiss={() => setToast(null)} />

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B1F44] tracking-tight mb-1">
          {t.title}
        </h1>
        <p className="text-sm text-slate-500 font-medium">{t.subtitle}</p>
      </div>

      {/* Results count */}
      {!loading && candidates.length > 0 && (
        <p className="text-[13px] font-semibold text-slate-400 mb-4">{t.found(candidates.length)}</p>
      )}

      {/* Loading state */}
      {loading ? (
        <SkeletonList count={3} />
      ) : candidates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center">
          <HeartOff size={40} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-bold text-[#0B1F44] mb-2">{t.noCandidates}</h3>
          <p className="text-sm text-slate-500 mb-6">{t.noCandidatesHint}</p>
          <a
            href={`/${locale}/dashboard/employer/candidates`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#162C66] text-white text-[13px] font-bold rounded-xl hover:bg-[#0F1E45] transition-all"
          >
            <Search size={15} />
            {t.browseCandidates}
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {candidates.map((candidate) => (
            <div
              key={candidate.id}
              className="group bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all overflow-hidden"
            >
              <div className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <img
                    src={candidate.photo}
                    alt={candidate.firstName}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-slate-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-lg sm:text-xl font-extrabold text-[#0B1F44] leading-snug">{candidate.firstName}</h3>
                        <p className="text-[15px] sm:text-base font-bold text-[#162C66]/70 mt-1 flex items-center gap-1.5">
                          <Briefcase size={15} className="text-[#162C66]/50" />{candidate.profession}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRemoveFavorite(candidate.id); }}
                          className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-100 text-rose-500 border border-rose-200 hover:bg-rose-200 transition-all"
                          title={t.remove}
                        >
                          <Heart size={16} fill="currentColor" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowShareMenu(showShareMenu === candidate.id ? null : candidate.id)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 text-blue-400 border border-blue-100 hover:text-blue-600 hover:bg-blue-100 transition-all"
                        >
                          <Share2 size={15} />
                        </button>
                      </div>
                    </div>
                    {candidate.experience && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-lg text-emerald-700 text-[13px] font-bold tracking-wide border border-emerald-100">
                        <Award size={13} className="text-emerald-500" />
                        {candidate.experience} {t.experience}
                      </span>
                    )}
                    {/* Spoken languages */}
                    {candidate.spokenLanguages.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="w-6 h-6 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                          <Globe size={12} className="text-sky-600" />
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          {candidate.spokenLanguages.map((lang) => (
                            <span
                              key={lang}
                              title={LANG_NAMES[locale]?.[lang] || lang}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-[11px] sm:text-[12px] font-medium text-slate-600 rounded-md"
                            >
                              <span className="text-[13px] leading-none">{LANG_FLAGS[lang] || '🌐'}</span>
                              <span className="hidden sm:inline">{LANG_NAMES[locale]?.[lang] || lang}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Share dropdown inline */}
                {showShareMenu === candidate.id && (
                  <div className="mt-3 bg-slate-50 rounded-xl border border-slate-200 p-2 flex items-center gap-1">
                    <button
                      type="button"
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-white text-[12px] font-semibold text-slate-600 transition-colors"
                      onClick={() => { const url = buildShareUrl('ad', candidate.id); shareWhatsApp(url); trackShare('ad', candidate.id); setShowShareMenu(null); setToast(t.sharedWa); }}
                    >
                      <FaWhatsapp color="#25D366" size={15} /> WhatsApp
                    </button>
                    <button
                      type="button"
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-white text-[12px] font-semibold text-slate-600 transition-colors"
                      onClick={() => { const url = buildShareUrl('ad', candidate.id); shareFacebook(url); trackShare('ad', candidate.id); setShowShareMenu(null); setToast(t.sharedFb); }}
                    >
                      <FaFacebook color="#1877F2" size={15} /> Facebook
                    </button>
                    <button
                      type="button"
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-white text-[12px] font-semibold text-slate-600 transition-colors"
                      onClick={() => { const url = buildShareUrl('ad', candidate.id); copyLink(url); trackShare('ad', candidate.id); setShowShareMenu(null); setToast(t.linkCopied); }}
                    >
                      <Copy size={14} className="text-slate-400" /> Link
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-4">
                  {candidate.location && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-[12px] sm:text-[13px] font-bold rounded-lg border border-amber-100">
                      <MapPin size={12} className="text-amber-500" />{candidate.location}
                    </span>
                  )}
                  {candidate.skills.map((skill) => (
                    <span key={skill} className="inline-flex items-center gap-1 px-3 py-1.5 bg-violet-50 text-violet-700 text-[12px] sm:text-[13px] font-bold rounded-lg border border-violet-100">
                      <Sparkles size={11} className="text-violet-400" />{skill}
                    </span>
                  ))}
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => openCandidateDetail(candidate)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#162C66]/[0.06] text-[#162C66] text-[13px] font-bold rounded-xl hover:bg-[#162C66] hover:text-white border border-[#162C66]/20 transition-all"
                  >
                    <Eye size={15} />
                    {t.showMore}
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setSelectedCandidate(null); setShowShareMenu(null); }}>
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative p-6 pb-4">
              <button
                type="button"
                onClick={() => { setSelectedCandidate(null); setShowShareMenu(null); }}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-4 mb-5">
                <img
                  src={selectedCandidate.photo}
                  alt={selectedCandidate.firstName}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-100"
                />
                <div>
                  <h2 className="text-xl font-extrabold text-[#0B1F44]">{selectedCandidate.firstName}</h2>
                  <p className="text-sm font-semibold text-slate-500">{selectedCandidate.profession}</p>
                  {selectedCandidate.location && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <MapPin size={13} className="text-slate-400" />
                      <span className="text-[13px] font-medium text-slate-500">{selectedCandidate.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedCandidate.experience && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="px-4 py-2 bg-emerald-50 rounded-xl">
                    <span className="text-emerald-700 text-lg font-extrabold">{selectedCandidate.experience}</span>
                    <span className="text-emerald-600 text-sm font-bold ml-2">{t.experience}</span>
                  </div>
                </div>
              )}

              {selectedCandidate.spokenLanguages.length > 0 && (
                <div className="mb-5">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.languages}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.spokenLanguages.map((lang) => (
                      <span key={lang} className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-50 text-sky-700 text-[13px] font-semibold rounded-lg border border-sky-100">
                        {LANG_FLAGS[lang] || '🌐'} {LANG_NAMES[locale]?.[lang] || lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedCandidate.skills.length > 0 && (
                <div className="mb-5">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.skills}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.skills.map((skill) => (
                      <span key={skill} className="px-3 py-1.5 bg-[#162C66]/[0.06] text-[#162C66] text-[13px] font-semibold rounded-lg">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 p-6 pt-4 space-y-3">
              <Button
                type="button"
                variant="primary"
                className="w-full justify-center h-12 rounded-xl font-bold gap-2"
                onClick={async () => {
                  try {
                    const token = getToken();
                    if (!token) return;
                    const res = await api.post<{ ok: boolean; conversation: { id: string } }>('/api/messages/conversations', { targetUserId: selectedCandidate.userId }, token);
                    setSelectedCandidate(null); setShowShareMenu(null);
                    window.location.href = `/${locale}/dashboard/employer/messages?conv=${res.conversation.id}`;
                  } catch { setToast(t.contactSent); setTimeout(() => setToast(null), 3000); }
                }}
              >
                <MessageSquare size={18} />
                {t.contact(selectedCandidate.firstName)}
              </Button>

              <button
                type="button"
                onClick={() => handleRemoveFavorite(selectedCandidate.id)}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-[13px] font-bold border bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 transition-all"
              >
                <Heart size={16} fill="currentColor" />
                {t.remove}
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowShareMenu(showShareMenu === selectedCandidate.id ? null : selectedCandidate.id)}
                  className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-[13px] font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all"
                >
                  <Share2 size={16} />
                  {t.shareWith}
                </button>
                {showShareMenu === selectedCandidate.id && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl border border-slate-200 shadow-lg p-2 z-10">
                    <button
                      type="button"
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 text-[13px] font-semibold text-slate-700 transition-colors"
                      onClick={() => { if (selectedCandidate) { const url = buildShareUrl('ad', selectedCandidate.id); shareWhatsApp(url); trackShare('ad', selectedCandidate.id); } setShowShareMenu(null); setToast(t.sharedWa); }}
                    >
                      <FaWhatsapp color="#25D366" size={16} /> WhatsApp
                    </button>
                    <button
                      type="button"
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 text-[13px] font-semibold text-slate-700 transition-colors"
                      onClick={() => { if (selectedCandidate) { const url = buildShareUrl('ad', selectedCandidate.id); shareFacebook(url); trackShare('ad', selectedCandidate.id); } setShowShareMenu(null); setToast(t.sharedFb); }}
                    >
                      <FaFacebook color="#1877F2" size={16} /> Facebook
                    </button>
                    <button
                      type="button"
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 text-[13px] font-semibold text-slate-700 transition-colors"
                      onClick={() => { if (selectedCandidate) { const url = buildShareUrl('ad', selectedCandidate.id); copyLink(url); trackShare('ad', selectedCandidate.id); } setShowShareMenu(null); setToast(t.linkCopied); }}
                    >
                      <Copy size={16} className="text-slate-500" /> Copy link
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
