'use client';

import { useLocale } from 'next-intl';
import { FaApple, FaGooglePlay } from 'react-icons/fa';
import { Smartphone } from 'lucide-react';

const loc = {
  de: {
    badge: 'COMING SOON',
    title: 'Bald auch als App',
    subtitle: 'Wir arbeiten an unserer mobilen App für iOS und Android. Sei unter den Ersten, die sie nutzen!',
    apple: 'App Store',
    google: 'Google Play',
    soon: 'Bald verfügbar',
  },
  en: {
    badge: 'COMING SOON',
    title: 'Soon on your phone',
    subtitle: 'We\'re building our mobile app for iOS and Android. Be among the first to use it!',
    apple: 'App Store',
    google: 'Google Play',
    soon: 'Coming soon',
  },
  fr: {
    badge: 'BIENTÔT',
    title: 'Bientôt sur votre téléphone',
    subtitle: 'Nous développons notre application mobile pour iOS et Android. Soyez parmi les premiers !',
    apple: 'App Store',
    google: 'Google Play',
    soon: 'Bientôt disponible',
  },
  it: {
    badge: 'IN ARRIVO',
    title: 'Presto anche come app',
    subtitle: 'Stiamo lavorando alla nostra app mobile per iOS e Android. Sii tra i primi a usarla!',
    apple: 'App Store',
    google: 'Google Play',
    soon: 'In arrivo',
  },
  sq: {
    badge: 'SË SHPEJTI',
    title: 'Së shpejti edhe si aplikacion',
    subtitle: 'Ne jemi duke punuar në aplikacionin tonë mobil për iOS dhe Android. Bëhuni ndër të parët!',
    apple: 'App Store',
    google: 'Google Play',
    soon: 'Së shpejti',
  },
} as const;

export default function AppComingSoon() {
  const locale = useLocale() as keyof typeof loc;
  const l = loc[locale] ?? loc.de;

  return (
    <section className="py-10 sm:py-14 bg-gradient-to-b from-white to-[#F7F7F7]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-[#162C66] rounded-3xl p-8 sm:p-10 text-center overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#F5C400]/10 rounded-full" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />

          <div className="relative z-10">
            {/* Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F5C400] text-[#162C66] text-[11px] sm:text-xs font-extrabold tracking-widest rounded-full mb-5">
              <Smartphone size={13} />
              {l.badge}
            </span>

            <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-3 leading-tight">
              {l.title}
            </h3>
            <p className="text-sm sm:text-[15px] text-white/60 font-medium max-w-md mx-auto mb-8 leading-relaxed">
              {l.subtitle}
            </p>

            {/* App Store Badges */}
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2.5 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl px-5 py-3 transition-all cursor-default">
                <FaApple size={24} className="text-white" />
                <div className="text-left">
                  <p className="text-[10px] sm:text-[11px] text-white/50 font-medium leading-none">{l.soon}</p>
                  <p className="text-sm sm:text-[15px] text-white font-bold leading-snug">{l.apple}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl px-5 py-3 transition-all cursor-default">
                <FaGooglePlay size={20} className="text-white" />
                <div className="text-left">
                  <p className="text-[10px] sm:text-[11px] text-white/50 font-medium leading-none">{l.soon}</p>
                  <p className="text-sm sm:text-[15px] text-white font-bold leading-snug">{l.google}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
