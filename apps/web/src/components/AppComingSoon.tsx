'use client';

import { useLocale } from 'next-intl';
import { FaApple, FaGooglePlay } from 'react-icons/fa';
import { Smartphone } from 'lucide-react';

const APP_STORE_URL = 'https://apps.apple.com/app/id6765750376';
const PLAY_STORE_URL = ''; // Filled in once the Android build is live.

const loc = {
  de: {
    badge: 'JETZT VERFÜGBAR',
    title: 'gjej-pune App',
    subtitle: 'Lade die App herunter und finde noch heute deinen Job — schnell, mobil und überall.',
    apple: 'App Store',
    google: 'Google Play',
    available: 'Lade im',
    soon: 'Bald verfügbar',
  },
  en: {
    badge: 'AVAILABLE NOW',
    title: 'gjej-pune App',
    subtitle: 'Download the app and find your job today — fast, mobile, anywhere.',
    apple: 'App Store',
    google: 'Google Play',
    available: 'Download on the',
    soon: 'Coming soon',
  },
  fr: {
    badge: 'DISPONIBLE',
    title: 'App gjej-pune',
    subtitle: "Téléchargez l'application et trouvez votre emploi dès aujourd'hui — rapide, mobile, partout.",
    apple: 'App Store',
    google: 'Google Play',
    available: 'Télécharger sur',
    soon: 'Bientôt disponible',
  },
  it: {
    badge: 'DISPONIBILE',
    title: 'App gjej-pune',
    subtitle: "Scarica l'app e trova oggi il tuo lavoro — veloce, mobile, ovunque.",
    apple: 'App Store',
    google: 'Google Play',
    available: 'Scarica su',
    soon: 'In arrivo',
  },
  sq: {
    badge: 'TANI E DISPONUESHME',
    title: 'Aplikacioni gjej-pune',
    subtitle: 'Shkarko aplikacionin dhe gjej punën sot — shpejt, mobil, kudo.',
    apple: 'App Store',
    google: 'Google Play',
    available: 'Shkarko në',
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
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#F5C400]/10 rounded-full" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />

          <div className="relative z-10">
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

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 bg-white text-[#162C66] hover:bg-white/90 rounded-xl px-5 py-3 transition-all w-full sm:w-auto justify-center"
              >
                <FaApple size={24} />
                <div className="text-left">
                  <p className="text-[10px] sm:text-[11px] text-[#162C66]/60 font-medium leading-none">
                    {l.available}
                  </p>
                  <p className="text-sm sm:text-[15px] font-bold leading-snug">
                    {l.apple}
                  </p>
                </div>
              </a>
              {PLAY_STORE_URL ? (
                <a
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 bg-white text-[#162C66] hover:bg-white/90 rounded-xl px-5 py-3 transition-all w-full sm:w-auto justify-center"
                >
                  <FaGooglePlay size={20} />
                  <div className="text-left">
                    <p className="text-[10px] sm:text-[11px] text-[#162C66]/60 font-medium leading-none">
                      {l.available}
                    </p>
                    <p className="text-sm sm:text-[15px] font-bold leading-snug">
                      {l.google}
                    </p>
                  </div>
                </a>
              ) : (
                <div className="flex items-center gap-2.5 bg-white/10 border border-white/20 rounded-xl px-5 py-3 cursor-default w-full sm:w-auto justify-center">
                  <FaGooglePlay size={20} className="text-white/70" />
                  <div className="text-left">
                    <p className="text-[10px] sm:text-[11px] text-white/40 font-medium leading-none">
                      {l.soon}
                    </p>
                    <p className="text-sm sm:text-[15px] text-white font-bold leading-snug">
                      {l.google}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
