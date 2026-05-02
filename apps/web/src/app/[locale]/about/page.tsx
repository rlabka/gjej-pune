import Header from '@/components/Header';
import Footer from '@/components/Footer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getAboutContent(locale: string): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${API_URL}/api/cms/content/AboutUs?locale=${locale}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return {};
    const data = await res.json();
    if (!data.ok) return {};
    const result: Record<string, string> = {};
    for (const item of data.content || []) {
      result[item.fieldKey] = item.value;
    }
    return result;
  } catch {
    return {};
  }
}

const defaults: Record<string, Record<string, string>> = {
  de: {
    title: 'Über uns',
    subtitle: 'Die führende Job-Matching-Plattform, die Talente mit den besten Arbeitgebern in Europa verbindet.',
    badge: 'Seit 2024 vertrauenswürdig',
    mission_title: 'Unsere Mission',
    mission_text: 'gjej-pune.com wurde mit einer klaren Vision gegründet: Den Bewerbungsprozess für Jobsuchende und Arbeitgeber gleichermassen zu revolutionieren. Wir kombinieren modernste Technologie mit einem tiefen Verständnis des Arbeitsmarkts, um die perfekte Verbindung zwischen Talent und Unternehmen herzustellen.\n\nWir glauben, dass der richtige Job das Leben verändern kann — und dass jeder Mensch diese Chance verdient. Deshalb arbeiten wir jeden Tag daran, Barrieren abzubauen und Möglichkeiten zu schaffen.',
    values_title: 'Unsere Werte',
    values_subtitle: 'Die Prinzipien, die unser Handeln leiten',
    value1_title: 'Transparenz',
    value1_text: 'Wir stehen für offene Kommunikation, klare Prozesse und ehrliche Zusammenarbeit. Jeder Schritt ist nachvollziehbar.',
    value2_title: 'Innovation',
    value2_text: 'Wir nutzen modernste Technologien und KI-gestützte Algorithmen, um die beste und schnellste Nutzererfahrung zu bieten.',
    value3_title: 'Vertrauen',
    value3_text: 'Datenschutz und Sicherheit stehen bei uns an erster Stelle. Ihre Daten sind bei uns in den besten Händen.',
    value4_title: 'Vielfalt',
    value4_text: 'Wir fördern Chancengleichheit und bringen Menschen unterschiedlichster Hintergründe zusammen.',
    team_title: 'Das Team hinter gjej-pune.com',
    team_text: 'Ein engagiertes, internationales Team aus erfahrenen Entwicklern, kreativen Designern und HR-Experten arbeitet täglich daran, die Plattform zu verbessern. Wir vereinen technisches Know-how mit menschlichem Einfühlungsvermögen, um eine Plattform zu schaffen, die wirklich einen Unterschied macht.',
    stat1_value: '10.000+',
    stat1_label: 'Registrierte Nutzer',
    stat2_value: '5.000+',
    stat2_label: 'Stellenangebote',
    stat3_value: '500+',
    stat3_label: 'Unternehmen',
    stat4_value: '98%',
    stat4_label: 'Zufriedenheit',
    dept1: 'Engineering',
    dept2: 'Design',
    dept3: 'HR & Support',
    dept4: 'Data & Analytics',
    card_support_value: '24/7',
    card_support_label: 'Support',
    card_languages_title: '5 Sprachen',
    card_languages_desc: 'Mehrsprachige Plattform',
    card_gdpr_title: 'DSGVO-konform',
    card_gdpr_desc: 'Datenschutz garantiert',
    card_security_value: 'A+',
    card_security_label: 'Sicherheitsrating',
    cta_title: 'Bereit für den nächsten Karriereschritt?',
    cta_text: 'Registrieren Sie sich kostenlos und entdecken Sie tausende Möglichkeiten, die auf Sie warten.',
    cta_button: 'Kostenlos registrieren',
    cta_contact: 'Kontaktieren Sie uns',
    mission_quote: 'Wir glauben, dass der richtige Job das Leben verändern kann — und dass jeder Mensch diese Chance verdient.',
    founder_label: 'Gründerteam',
  },
  en: {
    title: 'About Us',
    subtitle: 'The leading job matching platform connecting talent with the best employers across Europe.',
    badge: 'Trusted since 2024',
    mission_title: 'Our Mission',
    mission_text: 'gjej-pune.com was founded with a clear vision: To revolutionize the application process for job seekers and employers alike. We combine cutting-edge technology with deep labor market understanding to create perfect connections between talent and companies.\n\nWe believe the right job can change lives — and that everyone deserves this opportunity. That\'s why we work every day to break down barriers and create possibilities.',
    values_title: 'Our Values',
    values_subtitle: 'The principles that guide our actions',
    value1_title: 'Transparency',
    value1_text: 'We stand for open communication, clear processes and honest collaboration. Every step is traceable.',
    value2_title: 'Innovation',
    value2_text: 'We use cutting-edge technologies and AI-powered algorithms to deliver the best and fastest user experience.',
    value3_title: 'Trust',
    value3_text: 'Data protection and security are our top priorities. Your data is in the best hands with us.',
    value4_title: 'Diversity',
    value4_text: 'We promote equal opportunities and bring people of diverse backgrounds together.',
    team_title: 'The team behind gjej-pune.com',
    team_text: 'A dedicated, international team of experienced developers, creative designers and HR experts works daily to improve the platform. We combine technical know-how with human empathy to create a platform that truly makes a difference.',
    stat1_value: '10,000+',
    stat1_label: 'Registered users',
    stat2_value: '5,000+',
    stat2_label: 'Job listings',
    stat3_value: '500+',
    stat3_label: 'Companies',
    stat4_value: '98%',
    stat4_label: 'Satisfaction',
    dept1: 'Engineering',
    dept2: 'Design',
    dept3: 'HR & Support',
    dept4: 'Data & Analytics',
    card_support_value: '24/7',
    card_support_label: 'Support',
    card_languages_title: '5 Languages',
    card_languages_desc: 'Multilingual platform',
    card_gdpr_title: 'GDPR compliant',
    card_gdpr_desc: 'Data protection guaranteed',
    card_security_value: 'A+',
    card_security_label: 'Security rating',
    cta_title: 'Ready for the next career step?',
    cta_text: 'Register for free and discover thousands of opportunities waiting for you.',
    cta_button: 'Register for free',
    cta_contact: 'Contact us',
    mission_quote: 'We believe that the right job can change lives — and that everyone deserves this opportunity.',
    founder_label: 'Founding team',
  },
  fr: {
    title: 'À propos',
    subtitle: 'La principale plateforme de mise en relation professionnelle, connectant les talents aux meilleurs employeurs en Europe.',
    badge: 'De confiance depuis 2024',
    mission_title: 'Notre mission',
    mission_text: 'gjej-pune.com a été fondé avec une vision claire : Révolutionner le processus de candidature pour les chercheurs d\'emploi et les employeurs. Nous combinons technologie de pointe et compréhension approfondie du marché du travail.\n\nNous croyons que le bon emploi peut changer des vies — et que chacun mérite cette opportunité.',
    values_title: 'Nos valeurs',
    values_subtitle: 'Les principes qui guident nos actions',
    value1_title: 'Transparence',
    value1_text: 'Nous défendons la communication ouverte, des processus clairs et une collaboration honnête.',
    value2_title: 'Innovation',
    value2_text: 'Nous utilisons les technologies les plus modernes et des algorithmes IA pour la meilleure expérience.',
    value3_title: 'Confiance',
    value3_text: 'La protection des données et la sécurité sont nos priorités absolues.',
    value4_title: 'Diversité',
    value4_text: 'Nous promouvons l\'égalité des chances et rassemblons des personnes de tous horizons.',
    team_title: 'L\'équipe derrière gjej-pune.com',
    team_text: 'Une équipe internationale dédiée de développeurs, designers et experts RH travaille quotidiennement pour améliorer la plateforme.',
    stat1_value: '10 000+',
    stat1_label: 'Utilisateurs inscrits',
    stat2_value: '5 000+',
    stat2_label: 'Offres d\'emploi',
    stat3_value: '500+',
    stat3_label: 'Entreprises',
    stat4_value: '98%',
    stat4_label: 'Satisfaction',
    dept1: 'Ingénierie',
    dept2: 'Design',
    dept3: 'RH & Support',
    dept4: 'Données & Analytique',
    card_support_value: '24/7',
    card_support_label: 'Support',
    card_languages_title: '5 langues',
    card_languages_desc: 'Plateforme multilingue',
    card_gdpr_title: 'Conforme RGPD',
    card_gdpr_desc: 'Protection des données garantie',
    card_security_value: 'A+',
    card_security_label: 'Note de sécurité',
    cta_title: 'Prêt pour la prochaine étape ?',
    cta_text: 'Inscrivez-vous gratuitement et découvrez des milliers d\'opportunités.',
    cta_button: 'S\'inscrire gratuitement',
    cta_contact: 'Contactez-nous',
    mission_quote: 'Nous croyons que le bon emploi peut changer des vies — et que chacun mérite cette opportunité.',
    founder_label: 'Équipe fondatrice',
  },
  it: {
    title: 'Chi siamo',
    subtitle: 'La piattaforma leader di job matching che collega i talenti con i migliori datori di lavoro in Europa.',
    badge: 'Affidabile dal 2024',
    mission_title: 'La nostra missione',
    mission_text: 'gjej-pune.com è stato fondato con una visione chiara: Rivoluzionare il processo di candidatura per candidati e datori di lavoro. Combiniamo tecnologia all\'avanguardia con una profonda comprensione del mercato del lavoro.\n\nCrediamo che il lavoro giusto possa cambiare la vita — e che tutti meritino questa opportunità.',
    values_title: 'I nostri valori',
    values_subtitle: 'I principi che guidano le nostre azioni',
    value1_title: 'Trasparenza',
    value1_text: 'Ci impegniamo per una comunicazione aperta, processi chiari e collaborazione onesta.',
    value2_title: 'Innovazione',
    value2_text: 'Utilizziamo tecnologie all\'avanguardia e algoritmi AI per la migliore esperienza utente.',
    value3_title: 'Fiducia',
    value3_text: 'La protezione dei dati e la sicurezza sono le nostre priorità assolute.',
    value4_title: 'Diversità',
    value4_text: 'Promuoviamo le pari opportunità e uniamo persone di ogni provenienza.',
    team_title: 'Il team dietro gjej-pune.com',
    team_text: 'Un team internazionale dedicato di sviluppatori, designer e esperti HR lavora quotidianamente per migliorare la piattaforma.',
    stat1_value: '10.000+',
    stat1_label: 'Utenti registrati',
    stat2_value: '5.000+',
    stat2_label: 'Offerte di lavoro',
    stat3_value: '500+',
    stat3_label: 'Aziende',
    stat4_value: '98%',
    stat4_label: 'Soddisfazione',
    dept1: 'Ingegneria',
    dept2: 'Design',
    dept3: 'HR & Supporto',
    dept4: 'Dati & Analisi',
    card_support_value: '24/7',
    card_support_label: 'Supporto',
    card_languages_title: '5 lingue',
    card_languages_desc: 'Piattaforma multilingue',
    card_gdpr_title: 'Conforme GDPR',
    card_gdpr_desc: 'Protezione dati garantita',
    card_security_value: 'A+',
    card_security_label: 'Valutazione sicurezza',
    cta_title: 'Pronti per il prossimo passo?',
    cta_text: 'Registratevi gratuitamente e scoprite migliaia di opportunità.',
    cta_button: 'Registrati gratuitamente',
    cta_contact: 'Contattateci',
    mission_quote: 'Crediamo che il lavoro giusto possa cambiare la vita — e che tutti meritino questa opportunità.',
    founder_label: 'Team fondatore',
  },
  sq: {
    title: 'Rreth nesh',
    subtitle: 'Platforma kryesore e përputhjes së punës, që lidh talentet me punëdhënësit më të mirë në Evropë.',
    badge: 'E besueshme që nga 2024',
    mission_title: 'Misioni ynë',
    mission_text: 'gjej-pune.com u themelua me një vizion të qartë: Të revolucionarizojë procesin e aplikimit për punëkërkuesit dhe punëdhënësit. Ne kombinojmë teknologjinë më moderne me një kuptim të thellë të tregut të punës.\n\nNe besojmë se puna e duhur mund të ndryshojë jetën — dhe se çdokush e meriton këtë mundësi.',
    values_title: 'Vlerat tona',
    values_subtitle: 'Parimet që udhëheqin veprimet tona',
    value1_title: 'Transparenca',
    value1_text: 'Ne mbrojmë komunikimin e hapur, proceset e qarta dhe bashkëpunimin e sinqertë.',
    value2_title: 'Inovacioni',
    value2_text: 'Përdorim teknologjitë më moderne dhe algoritme AI për përvojën më të mirë.',
    value3_title: 'Besimi',
    value3_text: 'Mbrojtja e të dhënave dhe siguria janë prioritetet tona absolute.',
    value4_title: 'Diversiteti',
    value4_text: 'Promovojmë mundësi të barabarta dhe bashkojmë njerëz me prejardhje të ndryshme.',
    team_title: 'Ekipi pas gjej-pune.com',
    team_text: 'Një ekip ndërkombëtar i përkushtuar zhvilluesish, dizajnerësh dhe ekspertësh HR punon çdo ditë për të përmirësuar platformën.',
    stat1_value: '10,000+',
    stat1_label: 'Përdorues të regjistruar',
    stat2_value: '5,000+',
    stat2_label: 'Oferta pune',
    stat3_value: '500+',
    stat3_label: 'Kompani',
    stat4_value: '98%',
    stat4_label: 'Kënaqësi',
    dept1: 'Inxhinieri',
    dept2: 'Dizajn',
    dept3: 'HR & Mbështetje',
    dept4: 'Të dhëna & Analitikë',
    card_support_value: '24/7',
    card_support_label: 'Mbështetje',
    card_languages_title: '5 gjuhë',
    card_languages_desc: 'Platformë shumëgjuhëshe',
    card_gdpr_title: 'Konform me GDPR',
    card_gdpr_desc: 'Mbrojtja e të dhënave e garantuar',
    card_security_value: 'A+',
    card_security_label: 'Vlerësimi i sigurisë',
    cta_title: 'Gati për hapin tjetër?',
    cta_text: 'Regjistrohuni falas dhe zbuloni mijëra mundësi që ju presin.',
    cta_button: 'Regjistrohu falas',
    cta_contact: 'Na kontaktoni',
    mission_quote: 'Ne besojmë se puna e duhur mund të ndryshojë jetën — dhe se çdokush e meriton këtë mundësi.',
    founder_label: 'Ekipi themelues',
  },
};

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cms = await getAboutContent(locale);
  const d = defaults[locale] || defaults.de;

  const get = (key: string) => cms[key] || d[key] || '';

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0F1E45] via-[#162C66] to-[#1a3570]">
          {/* Decorative elements */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#F5C400]/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full mb-8">
                <div className="w-2 h-2 bg-[#F5C400] rounded-full" />
                <span className="text-white/80 text-sm font-semibold tracking-wide">{get('badge')}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-6 leading-[1.1]">
                {get('title')}
              </h1>
              <p className="text-lg sm:text-xl text-white/60 font-medium max-w-3xl mx-auto leading-relaxed">
                {get('subtitle')}
              </p>
            </div>

            {/* Stats Bar */}
            <div className="mt-16 sm:mt-20">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="bg-white/[0.07] backdrop-blur-sm border border-white/10 rounded-2xl p-5 sm:p-6 text-center hover:bg-white/[0.12] transition-all duration-300">
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#F5C400] mb-1 tracking-tight">
                      {get(`stat${n}_value`)}
                    </div>
                    <div className="text-xs sm:text-sm text-white/50 font-semibold uppercase tracking-wider">
                      {get(`stat${n}_label`)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
              <path d="M0 60V30C240 0 480 0 720 15C960 30 1200 45 1440 30V60H0Z" fill="white" />
            </svg>
          </div>
        </section>

        {/* ── Mission Section ── */}
        <section className="py-16 sm:py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Left: Visual */}
              <div className="relative">
                <div className="bg-gradient-to-br from-[#162C66] to-[#0F1E45] rounded-3xl p-10 sm:p-14 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-[#F5C400]/10 rounded-full blur-2xl" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl" />
                  <div className="relative">
                    <div className="w-16 h-16 bg-[#F5C400]/20 rounded-2xl flex items-center justify-center mb-8">
                      <svg width="32" height="32" fill="none" stroke="#F5C400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <blockquote className="text-white/90 text-lg sm:text-xl font-medium leading-relaxed italic mb-6">
                      &ldquo;{get('mission_quote')}&rdquo;
                    </blockquote>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#F5C400] rounded-full flex items-center justify-center">
                        <span className="text-[#162C66] font-black text-sm">GP</span>
                      </div>
                      <div>
                        <div className="text-white font-bold text-sm">gjej-pune.com</div>
                        <div className="text-white/40 text-xs font-medium">{get('founder_label')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Content */}
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#162C66]/5 border border-[#162C66]/10 rounded-full mb-6">
                  <div className="w-1.5 h-1.5 bg-[#162C66] rounded-full" />
                  <span className="text-[#162C66] text-xs font-bold uppercase tracking-wider">{get('mission_title')}</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-black text-[#0B1F44] mb-6 leading-tight tracking-tight">
                  {get('mission_title')}
                </h2>

                {cms['mission_html'] ? (
                  <div
                    className="text-slate-600 text-base sm:text-[17px] leading-[1.8] [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[#162C66] [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-[#162C66] [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_li]:mb-1.5 [&_a]:text-[#162C66] [&_a]:underline [&_strong]:font-bold [&_strong]:text-[#162C66]"
                    dangerouslySetInnerHTML={{ __html: cms['mission_html'] }}
                  />
                ) : (
                  <div className="space-y-4">
                    {get('mission_text').split('\n').filter(Boolean).map((p, i) => (
                      <p key={i} className="text-slate-600 text-base sm:text-[17px] leading-[1.8]">{p}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Values Section ── */}
        <section className="py-16 sm:py-20 lg:py-28 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14 sm:mb-20">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#162C66]/5 border border-[#162C66]/10 rounded-full mb-6">
                <div className="w-1.5 h-1.5 bg-[#F5C400] rounded-full" />
                <span className="text-[#162C66] text-xs font-bold uppercase tracking-wider">{get('values_title')}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-[#0B1F44] mb-4 tracking-tight">
                {get('values_title')}
              </h2>
              <p className="text-slate-500 text-base sm:text-lg font-medium max-w-2xl mx-auto">
                {get('values_subtitle')}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {[
                { key: '1', gradient: 'from-blue-500/10 to-indigo-500/5', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-600', border: 'border-blue-100',
                  icon: '<svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' },
                { key: '2', gradient: 'from-amber-500/10 to-orange-500/5', iconBg: 'bg-amber-500/10', iconColor: 'text-amber-600', border: 'border-amber-100',
                  icon: '<svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>' },
                { key: '3', gradient: 'from-emerald-500/10 to-teal-500/5', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-600', border: 'border-emerald-100',
                  icon: '<svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' },
                { key: '4', gradient: 'from-violet-500/10 to-purple-500/5', iconBg: 'bg-violet-500/10', iconColor: 'text-violet-600', border: 'border-violet-100',
                  icon: '<svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
              ].map((v) => (
                <div
                  key={v.key}
                  className={`bg-white rounded-2xl border ${v.border} p-7 sm:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group`}
                >
                  <div className={`w-14 h-14 ${v.iconBg} rounded-2xl flex items-center justify-center mb-6 ${v.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                    <span dangerouslySetInnerHTML={{ __html: v.icon }} />
                  </div>
                  <h3 className="text-lg font-extrabold text-[#0B1F44] mb-3">{get(`value${v.key}_title`)}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{get(`value${v.key}_text`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Team Section ── */}
        <section className="py-16 sm:py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Left: Content */}
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#162C66]/5 border border-[#162C66]/10 rounded-full mb-6">
                  <div className="w-1.5 h-1.5 bg-[#162C66] rounded-full" />
                  <span className="text-[#162C66] text-xs font-bold uppercase tracking-wider">{get('team_title')}</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-black text-[#0B1F44] mb-6 leading-tight tracking-tight">
                  {get('team_title')}
                </h2>

                {cms['team_html'] ? (
                  <div
                    className="text-slate-600 text-base sm:text-[17px] leading-[1.8] [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_li]:mb-1.5 [&_a]:text-[#162C66] [&_a]:underline [&_strong]:font-bold [&_strong]:text-[#162C66]"
                    dangerouslySetInnerHTML={{ __html: cms['team_html'] }}
                  />
                ) : (
                  <p className="text-slate-600 text-base sm:text-[17px] leading-[1.8]">{get('team_text')}</p>
                )}

                {/* Mini feature list */}
                <div className="mt-8 grid grid-cols-2 gap-4">
                  {[
                    { icon: '&#x1f4bb;', key: 'dept1' },
                    { icon: '&#x1f3a8;', key: 'dept2' },
                    { icon: '&#x1f91d;', key: 'dept3' },
                    { icon: '&#x1f4c8;', key: 'dept4' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                      <span className="text-lg" dangerouslySetInnerHTML={{ __html: item.icon }} />
                      <span className="text-sm font-bold text-[#0B1F44]">{get(item.key)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Visual */}
              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-[#162C66] to-[#0F1E45] rounded-2xl p-6 text-white">
                      <div className="text-3xl font-black text-[#F5C400] mb-1">{get('card_support_value')}</div>
                      <div className="text-white/60 text-sm font-semibold">{get('card_support_label')}</div>
                    </div>
                    <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-6">
                      <div className="flex -space-x-2 mb-3">
                        {['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500'].map((c, i) => (
                          <div key={i} className={`w-8 h-8 ${c} rounded-full border-2 border-white flex items-center justify-center`}>
                            <span className="text-white text-[10px] font-bold">{['EN', 'DE', 'FR', 'AL'][i]}</span>
                          </div>
                        ))}
                      </div>
                      <div className="text-sm font-bold text-[#0B1F44]">{get('card_languages_title')}</div>
                      <div className="text-xs text-slate-400 font-medium">{get('card_languages_desc')}</div>
                    </div>
                  </div>
                  <div className="space-y-4 pt-8">
                    <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-6">
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
                        <svg width="20" height="20" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      </div>
                      <div className="text-sm font-bold text-[#0B1F44]">{get('card_gdpr_title')}</div>
                      <div className="text-xs text-slate-400 font-medium">{get('card_gdpr_desc')}</div>
                    </div>
                    <div className="bg-gradient-to-br from-[#F5C400] to-[#e6b800] rounded-2xl p-6">
                      <div className="text-3xl font-black text-[#162C66] mb-1">{get('card_security_value')}</div>
                      <div className="text-[#162C66]/70 text-sm font-semibold">{get('card_security_label')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA Section ── */}
        <section className="relative overflow-hidden">
          <div className="bg-gradient-to-br from-[#0F1E45] via-[#162C66] to-[#1a3570] py-20 sm:py-24 lg:py-32">
            {/* Decorative */}
            <div className="absolute inset-0">
              <div className="absolute top-1/4 left-0 w-72 h-72 bg-[#F5C400]/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
            </div>

            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
                {get('cta_title')}
              </h2>
              <p className="text-lg text-white/50 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
                {get('cta_text')}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href={`/${locale}/auth/register`}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-[#F5C400] text-[#162C66] font-extrabold text-base rounded-xl hover:bg-[#e6b800] transition-all shadow-xl shadow-[#F5C400]/20 hover:shadow-2xl hover:shadow-[#F5C400]/30 hover:-translate-y-0.5"
                >
                  {get('cta_button')}
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </a>
                <a
                  href={`/${locale}/contact`}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold text-base rounded-xl hover:bg-white/20 transition-all"
                >
                  {get('cta_contact')}
                </a>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
