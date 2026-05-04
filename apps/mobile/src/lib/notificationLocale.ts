/**
 * Notification translations — port of apps/web/src/lib/notificationLocale.ts.
 * Converts raw notification types (e.g. "profile_view") into localised
 * titles/bodies for display in the inbox and home dashboard.
 */

import { getTranslatedTitle, type Locale } from '@jmp/shared';

type NotifMeta = Record<string, unknown>;

const translations = {
  de: {
    titles: {
      profile_view: 'Profilbesuch',
      premium_activated: 'Premium aktiviert!',
      boost_active: 'Boost aktiv!',
      premium_cancelled: 'Abo gekündigt',
      ad_online: 'Anzeige online!',
      new_message: 'Neue Nachricht',
      new_match: 'Neuer passender Treffer',
    },
    bodies: {
      profile_view: (m: NotifMeta) =>
        m.viewerName
          ? `${m.viewerName} hat dein ${
              m.targetType === 'job' ? 'Stellenangebot' : 'Jobprofil'
            } angesehen.`
          : `Jemand hat dein ${
              m.targetType === 'job' ? 'Stellenangebot' : 'Jobprofil'
            } angesehen. 🔒 Premium freischalten, um zu sehen wer.`,
      new_match: (m: NotifMeta, locale: string) => {
        const cat = m.category ? getTranslatedTitle(String(m.category), locale as Locale) : '';
        return m.adId
          ? `Ein neuer Kandidat passt zu deinem Job: ${cat}`
          : `Eine neue Stelle passt zu deinem Profil: ${cat}`;
      },
      premium_activated: () =>
        'Dein Premium-Abo ist jetzt aktiv. Geniesse alle Vorteile!',
      boost_active: () =>
        'Deine Inserate werden jetzt bevorzugt in den Suchergebnissen angezeigt.',
      premium_cancelled: () =>
        'Dein Premium-Abo wurde deaktiviert. Du kannst es jederzeit wieder aktivieren.',
      ad_online: (m: NotifMeta, locale: string) =>
        `Dein Inserat "${
          m.adTitle ? getTranslatedTitle(String(m.adTitle), locale as Locale) : 'Neues Inserat'
        }" ist jetzt online.`,
      new_message: (m: NotifMeta) =>
        `${m.senderName || 'Jemand'} hat dir eine neue Nachricht gesendet.`,
    },
  },
  en: {
    titles: {
      profile_view: 'Profile View',
      premium_activated: 'Premium Activated!',
      boost_active: 'Boost Active!',
      premium_cancelled: 'Subscription Cancelled',
      ad_online: 'Ad Online!',
      new_message: 'New Message',
      new_match: 'New matching result',
    },
    bodies: {
      profile_view: (m: NotifMeta) =>
        m.viewerName
          ? `${m.viewerName} viewed your ${
              m.targetType === 'job' ? 'job listing' : 'job profile'
            }.`
          : `Someone viewed your ${
              m.targetType === 'job' ? 'job listing' : 'job profile'
            }. 🔒 Unlock Premium to see who.`,
      new_match: (m: NotifMeta, locale: string) => {
        const cat = m.category ? getTranslatedTitle(String(m.category), locale as Locale) : '';
        return m.adId
          ? `A new candidate matches your job: ${cat}`
          : `A new job matches your profile: ${cat}`;
      },
      premium_activated: () =>
        'Your Premium subscription is now active. Enjoy all benefits!',
      boost_active: () => 'Your listings are now boosted in search results.',
      premium_cancelled: () =>
        'Your Premium subscription has been deactivated. You can reactivate it anytime.',
      ad_online: (m: NotifMeta, locale: string) =>
        `Your listing "${
          m.adTitle ? getTranslatedTitle(String(m.adTitle), locale as Locale) : 'New listing'
        }" is now online.`,
      new_message: (m: NotifMeta) =>
        `${m.senderName || 'Someone'} sent you a new message.`,
    },
  },
  fr: {
    titles: {
      profile_view: 'Visite de profil',
      premium_activated: 'Premium activé !',
      boost_active: 'Boost actif !',
      premium_cancelled: 'Abonnement résilié',
      ad_online: 'Annonce en ligne !',
      new_message: 'Nouveau message',
      new_match: 'Nouveau résultat correspondant',
    },
    bodies: {
      profile_view: (m: NotifMeta) =>
        m.viewerName
          ? `${m.viewerName} a consulté votre ${
              m.targetType === 'job' ? "offre d'emploi" : 'profil'
            }.`
          : `Quelqu'un a consulté votre ${
              m.targetType === 'job' ? "offre d'emploi" : 'profil'
            }. 🔒 Débloquez Premium pour voir qui.`,
      new_match: (m: NotifMeta, locale: string) => {
        const cat = m.category ? getTranslatedTitle(String(m.category), locale as Locale) : '';
        return m.adId
          ? `Un nouveau candidat correspond à votre offre : ${cat}`
          : `Un nouveau poste correspond à votre profil : ${cat}`;
      },
      premium_activated: () =>
        'Votre abonnement Premium est maintenant actif. Profitez de tous les avantages !',
      boost_active: () =>
        'Vos annonces sont désormais mises en avant dans les résultats de recherche.',
      premium_cancelled: () =>
        'Votre abonnement Premium a été désactivé. Vous pouvez le réactiver à tout moment.',
      ad_online: (m: NotifMeta, locale: string) =>
        `Votre annonce "${
          m.adTitle ? getTranslatedTitle(String(m.adTitle), locale as Locale) : 'Nouvelle annonce'
        }" est maintenant en ligne.`,
      new_message: (m: NotifMeta) =>
        `${m.senderName || "Quelqu'un"} vous a envoyé un nouveau message.`,
    },
  },
  it: {
    titles: {
      profile_view: 'Visita al profilo',
      premium_activated: 'Premium attivato!',
      boost_active: 'Boost attivo!',
      premium_cancelled: 'Abbonamento annullato',
      ad_online: 'Annuncio online!',
      new_message: 'Nuovo messaggio',
      new_match: 'Nuovo abbinamento',
    },
    bodies: {
      profile_view: (m: NotifMeta) =>
        m.viewerName
          ? `${m.viewerName} ha visualizzato il tuo ${
              m.targetType === 'job' ? 'annuncio di lavoro' : 'profilo'
            }.`
          : `Qualcuno ha visualizzato il tuo ${
              m.targetType === 'job' ? 'annuncio di lavoro' : 'profilo'
            }. 🔒 Sblocca Premium per vedere chi.`,
      new_match: (m: NotifMeta, locale: string) => {
        const cat = m.category ? getTranslatedTitle(String(m.category), locale as Locale) : '';
        return m.adId
          ? `Un nuovo candidato corrisponde al tuo annuncio: ${cat}`
          : `Un nuovo lavoro corrisponde al tuo profilo: ${cat}`;
      },
      premium_activated: () =>
        'Il tuo abbonamento Premium è ora attivo. Goditi tutti i vantaggi!',
      boost_active: () =>
        'I tuoi annunci vengono ora evidenziati nei risultati di ricerca.',
      premium_cancelled: () =>
        'Il tuo abbonamento Premium è stato disattivato. Puoi riattivarlo in qualsiasi momento.',
      ad_online: (m: NotifMeta, locale: string) =>
        `Il tuo annuncio "${
          m.adTitle ? getTranslatedTitle(String(m.adTitle), locale as Locale) : 'Nuovo annuncio'
        }" è ora online.`,
      new_message: (m: NotifMeta) =>
        `${m.senderName || 'Qualcuno'} ti ha inviato un nuovo messaggio.`,
    },
  },
  sq: {
    titles: {
      profile_view: 'Vizitë profili',
      premium_activated: 'Premium i aktivizuar!',
      boost_active: 'Boost aktiv!',
      premium_cancelled: 'Abonimi u anulua',
      ad_online: 'Shpallja online!',
      new_message: 'Mesazh i ri',
      new_match: 'Përputhje e re',
    },
    bodies: {
      profile_view: (m: NotifMeta) =>
        m.viewerName
          ? `${m.viewerName} ka parë ${
              m.targetType === 'job' ? 'njoftimin e punës' : 'profilin'
            } tënd.`
          : `Dikush ka parë ${
              m.targetType === 'job' ? 'njoftimin e punës' : 'profilin'
            } tënd. 🔒 Aktivizo Premium për të parë kush.`,
      new_match: (m: NotifMeta, locale: string) => {
        const cat = m.category ? getTranslatedTitle(String(m.category), locale as Locale) : '';
        return m.adId
          ? `Një kandidat i ri përputhet me punën tënde: ${cat}`
          : `Një punë e re përputhet me profilin tënd: ${cat}`;
      },
      premium_activated: () =>
        'Abonimi yt Premium është tani aktiv. Shijo të gjitha përfitimet!',
      boost_active: () =>
        'Shpalljet e tua tani shfaqen të para në rezultatet e kërkimit.',
      premium_cancelled: () =>
        'Abonimi yt Premium u çaktivizua. Mund ta riaktivizosh në çdo kohë.',
      ad_online: (m: NotifMeta, locale: string) =>
        `Shpallja jote "${
          m.adTitle ? getTranslatedTitle(String(m.adTitle), locale as Locale) : 'Shpallje e re'
        }" është tani online.`,
      new_message: (m: NotifMeta) =>
        `${m.senderName || 'Dikush'} të ka dërguar një mesazh të ri.`,
    },
  },
} as const;

type SupportedLocale = keyof typeof translations;

function parseMeta(n: { meta?: string | unknown }): NotifMeta {
  if (!n.meta) return {};
  if (typeof n.meta === 'string') {
    try {
      return JSON.parse(n.meta);
    } catch {
      return {};
    }
  }
  return n.meta as NotifMeta;
}

export function getNotifTitle(
  n: { type: string; title: string; meta?: string | unknown },
  locale: string
): string {
  const t = translations[locale as SupportedLocale] ?? translations.de;
  return (t.titles as Record<string, string>)[n.type] ?? n.title ?? n.type;
}

export function getNotifBody(
  n: { type: string; body: string; meta?: string | unknown },
  locale: string
): string {
  const t = translations[locale as SupportedLocale] ?? translations.de;
  const fn = (t.bodies as Record<string, (m: NotifMeta, locale: string) => string>)[
    n.type
  ];
  if (fn) return fn(parseMeta(n), locale);
  return n.body || '';
}
