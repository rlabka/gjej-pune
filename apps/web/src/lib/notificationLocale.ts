// Notification translations — used by TopNav and Header dropdowns

import { getCachedCategories, getTranslatedTitle, type Locale } from '@/hooks/useCategories';

type NotifMeta = Record<string, unknown>;

const translations = {
  de: {
    markAllRead: 'Alle gelesen',
    titles: {
      profile_view: 'Profilbesuch',
      premium_activated: 'Premium aktiviert!',
      boost_active: 'Boost aktiv!',
      premium_cancelled: 'Abo gekündigt',
      ad_online: 'Anzeige online!',
      new_message: 'Neue Nachricht',
    },
    bodies: {
      profile_view: (m: NotifMeta) => `${m.viewerName || '?'} hat dein ${m.targetType === 'job' ? 'Stellenangebot' : 'Jobprofil'} angesehen.`,
      premium_activated: () => 'Dein Premium-Abo ist jetzt aktiv. Geniesse alle Vorteile!',
      boost_active: () => 'Deine Inserate werden jetzt bevorzugt in den Suchergebnissen angezeigt.',
      premium_cancelled: () => 'Dein Premium-Abo wurde deaktiviert. Du kannst es jederzeit wieder aktivieren.',
      ad_online: (m: NotifMeta, locale: string) => `Dein Inserat "${m.adTitle ? getTranslatedTitle(getCachedCategories(), String(m.adTitle), locale as Locale) : 'Neues Inserat'}" ist jetzt online.`,
      new_message: (m: NotifMeta) => `${m.senderName || 'Jemand'} hat dir eine neue Nachricht gesendet.`,
    },
  },
  en: {
    markAllRead: 'Mark all read',
    titles: {
      profile_view: 'Profile View',
      premium_activated: 'Premium Activated!',
      boost_active: 'Boost Active!',
      premium_cancelled: 'Subscription Cancelled',
      ad_online: 'Ad Online!',
      new_message: 'New Message',
    },
    bodies: {
      profile_view: (m: NotifMeta) => `${m.viewerName || '?'} viewed your ${m.targetType === 'job' ? 'job listing' : 'job profile'}.`,
      premium_activated: () => 'Your Premium subscription is now active. Enjoy all benefits!',
      boost_active: () => 'Your listings are now boosted in search results.',
      premium_cancelled: () => 'Your Premium subscription has been deactivated. You can reactivate it anytime.',
      ad_online: (m: NotifMeta, locale: string) => `Your listing "${m.adTitle ? getTranslatedTitle(getCachedCategories(), String(m.adTitle), locale as Locale) : 'New listing'}" is now online.`,
      new_message: (m: NotifMeta) => `${m.senderName || 'Someone'} sent you a new message.`,
    },
  },
  fr: {
    markAllRead: 'Tout marquer lu',
    titles: {
      profile_view: 'Visite de profil',
      premium_activated: 'Premium activé !',
      boost_active: 'Boost actif !',
      premium_cancelled: 'Abonnement résilié',
      ad_online: 'Annonce en ligne !',
      new_message: 'Nouveau message',
    },
    bodies: {
      profile_view: (m: NotifMeta) => `${m.viewerName || '?'} a consulté votre ${m.targetType === 'job' ? 'offre d\'emploi' : 'profil'}.`,
      premium_activated: () => 'Votre abonnement Premium est maintenant actif. Profitez de tous les avantages !',
      boost_active: () => 'Vos annonces sont désormais mises en avant dans les résultats de recherche.',
      premium_cancelled: () => 'Votre abonnement Premium a été désactivé. Vous pouvez le réactiver à tout moment.',
      ad_online: (m: NotifMeta, locale: string) => `Votre annonce "${m.adTitle ? getTranslatedTitle(getCachedCategories(), String(m.adTitle), locale as Locale) : 'Nouvelle annonce'}" est maintenant en ligne.`,
      new_message: (m: NotifMeta) => `${m.senderName || 'Quelqu\'un'} vous a envoyé un nouveau message.`,
    },
  },
  it: {
    markAllRead: 'Segna tutto letto',
    titles: {
      profile_view: 'Visita al profilo',
      premium_activated: 'Premium attivato!',
      boost_active: 'Boost attivo!',
      premium_cancelled: 'Abbonamento annullato',
      ad_online: 'Annuncio online!',
      new_message: 'Nuovo messaggio',
    },
    bodies: {
      profile_view: (m: NotifMeta) => `${m.viewerName || '?'} ha visualizzato il tuo ${m.targetType === 'job' ? 'annuncio di lavoro' : 'profilo'}.`,
      premium_activated: () => 'Il tuo abbonamento Premium è ora attivo. Goditi tutti i vantaggi!',
      boost_active: () => 'I tuoi annunci vengono ora evidenziati nei risultati di ricerca.',
      premium_cancelled: () => 'Il tuo abbonamento Premium è stato disattivato. Puoi riattivarlo in qualsiasi momento.',
      ad_online: (m: NotifMeta, locale: string) => `Il tuo annuncio "${m.adTitle ? getTranslatedTitle(getCachedCategories(), String(m.adTitle), locale as Locale) : 'Nuovo annuncio'}" è ora online.`,
      new_message: (m: NotifMeta) => `${m.senderName || 'Qualcuno'} ti ha inviato un nuovo messaggio.`,
    },
  },
  sq: {
    markAllRead: 'Shëno të gjitha të lexuara',
    titles: {
      profile_view: 'Vizitë profili',
      premium_activated: 'Premium i aktivizuar!',
      boost_active: 'Boost aktiv!',
      premium_cancelled: 'Abonimi u anulua',
      ad_online: 'Shpallja online!',
      new_message: 'Mesazh i ri',
    },
    bodies: {
      profile_view: (m: NotifMeta) => `${m.viewerName || '?'} ka parë ${m.targetType === 'job' ? 'njoftimin e punës' : 'profilin'} tënd.`,
      premium_activated: () => 'Abonimi yt Premium është tani aktiv. Shijo të gjitha përfitimet!',
      boost_active: () => 'Shpalljet e tua tani shfaqen të para në rezultatet e kërkimit.',
      premium_cancelled: () => 'Abonimi yt Premium u çaktivizua. Mund ta riaktivizosh në çdo kohë.',
      ad_online: (m: NotifMeta, locale: string) => `Shpallja jote "${m.adTitle ? getTranslatedTitle(getCachedCategories(), String(m.adTitle), locale as Locale) : 'Shpallje e re'}" është tani online.`,
      new_message: (m: NotifMeta) => `${m.senderName || 'Dikush'} të ka dërguar një mesazh të ri.`,
    },
  },
} as const;

type SupportedLocale = keyof typeof translations;

function parseMeta(n: { meta?: string | unknown }): NotifMeta {
  if (!n.meta) return {};
  if (typeof n.meta === 'string') {
    try { return JSON.parse(n.meta); } catch { return {}; }
  }
  return n.meta as NotifMeta;
}

export function getNotifTitle(n: { type: string; title: string; meta?: string | unknown }, locale: string): string {
  const t = translations[locale as SupportedLocale] ?? translations.de;
  return (t.titles as Record<string, string>)[n.type] ?? n.title ?? n.type;
}

export function getNotifBody(n: { type: string; body: string; meta?: string | unknown }, locale: string): string {
  const t = translations[locale as SupportedLocale] ?? translations.de;
  const fn = (t.bodies as Record<string, (m: NotifMeta, locale: string) => string>)[n.type];
  if (fn) return fn(parseMeta(n), locale);
  return n.body || '';
}

export function getMarkAllReadLabel(locale: string): string {
  const t = translations[locale as SupportedLocale] ?? translations.de;
  return t.markAllRead;
}
