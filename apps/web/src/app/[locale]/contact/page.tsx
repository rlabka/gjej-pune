'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Mail, Send, Loader2, CheckCircle2, User, MessageSquare, FileText } from 'lucide-react';
import { clsx } from 'clsx';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const ui = {
  de: {
    pageTitle: 'Kontakt',
    pageSubtitle: 'Haben Sie Fragen oder Anregungen? Wir freuen uns auf Ihre Nachricht.',
    nameLabel: 'Vollständiger Name',
    namePlaceholder: 'Max Mustermann',
    emailLabel: 'E-Mail-Adresse',
    emailPlaceholder: 'max@beispiel.de',
    phoneLabel: 'Telefon (optional)',
    phonePlaceholder: '+41 79 123 45 67',
    subjectLabel: 'Betreff',
    subjectPlaceholder: 'Wie können wir Ihnen helfen?',
    messageLabel: 'Ihre Nachricht',
    messagePlaceholder: 'Beschreiben Sie Ihr Anliegen...',
    submit: 'Nachricht senden',
    sending: 'Wird gesendet…',
    successTitle: 'Nachricht gesendet!',
    successDesc: 'Vielen Dank für Ihre Nachricht. Wir werden uns so schnell wie möglich bei Ihnen melden.',
    sendAnother: 'Weitere Nachricht senden',
    errorGeneric: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.',
    errorInvalidEmail: 'Diese E-Mail-Adresse ist ungültig. Bitte überprüfen Sie die Domain.',
    infoTitle: 'Kontaktinformationen',
    infoEmail: 'E-Mail',
    infoPhone: 'Telefon',
    defaultEmail: 'info@gjej-pune.com',
    defaultPhone: '+41 44 000 00 00',
    hours: 'Öffnungszeiten',
    hoursValue: 'Mo–Fr: 09:00–18:00',
  },
  en: {
    pageTitle: 'Contact',
    pageSubtitle: 'Have questions or suggestions? We look forward to your message.',
    nameLabel: 'Full name',
    namePlaceholder: 'John Doe',
    emailLabel: 'Email address',
    emailPlaceholder: 'john@example.com',
    phoneLabel: 'Phone (optional)',
    phonePlaceholder: '+41 79 123 45 67',
    subjectLabel: 'Subject',
    subjectPlaceholder: 'How can we help you?',
    messageLabel: 'Your message',
    messagePlaceholder: 'Describe your request...',
    submit: 'Send message',
    sending: 'Sending…',
    successTitle: 'Message sent!',
    successDesc: 'Thank you for your message. We will get back to you as soon as possible.',
    sendAnother: 'Send another message',
    errorGeneric: 'Something went wrong. Please try again.',
    errorInvalidEmail: 'This email address is invalid. Please check the domain.',
    infoTitle: 'Contact Information',
    infoEmail: 'Email',
    infoPhone: 'Phone',
    defaultEmail: 'info@gjej-pune.com',
    defaultPhone: '+41 44 000 00 00',
    hours: 'Business hours',
    hoursValue: 'Mon–Fri: 09:00–18:00',
  },
  fr: {
    pageTitle: 'Contact',
    pageSubtitle: 'Des questions ou suggestions ? Nous attendons votre message avec impatience.',
    nameLabel: 'Nom complet',
    namePlaceholder: 'Jean Dupont',
    emailLabel: 'Adresse e-mail',
    emailPlaceholder: 'jean@exemple.fr',
    phoneLabel: 'Téléphone (optionnel)',
    phonePlaceholder: '+41 79 123 45 67',
    subjectLabel: 'Objet',
    subjectPlaceholder: 'Comment pouvons-nous vous aider ?',
    messageLabel: 'Votre message',
    messagePlaceholder: 'Décrivez votre demande...',
    submit: 'Envoyer le message',
    sending: 'Envoi…',
    successTitle: 'Message envoyé !',
    successDesc: 'Merci pour votre message. Nous vous répondrons dans les plus brefs délais.',
    sendAnother: 'Envoyer un autre message',
    errorGeneric: 'Une erreur s\'est produite. Veuillez réessayer.',
    errorInvalidEmail: 'Cette adresse e-mail est invalide. Veuillez vérifier le domaine.',
    infoTitle: 'Informations de contact',
    infoEmail: 'E-mail',
    infoPhone: 'Téléphone',
    defaultEmail: 'info@gjej-pune.com',
    defaultPhone: '+41 44 000 00 00',
    hours: 'Heures d\'ouverture',
    hoursValue: 'Lun–Ven : 09:00–18:00',
  },
  it: {
    pageTitle: 'Contatto',
    pageSubtitle: 'Avete domande o suggerimenti? Non vediamo l\'ora di ricevere il vostro messaggio.',
    nameLabel: 'Nome completo',
    namePlaceholder: 'Mario Rossi',
    emailLabel: 'Indirizzo e-mail',
    emailPlaceholder: 'mario@esempio.it',
    phoneLabel: 'Telefono (opzionale)',
    phonePlaceholder: '+41 79 123 45 67',
    subjectLabel: 'Oggetto',
    subjectPlaceholder: 'Come possiamo aiutarvi?',
    messageLabel: 'Il vostro messaggio',
    messagePlaceholder: 'Descrivete la vostra richiesta...',
    submit: 'Invia messaggio',
    sending: 'Invio…',
    successTitle: 'Messaggio inviato!',
    successDesc: 'Grazie per il vostro messaggio. Vi risponderemo il prima possibile.',
    sendAnother: 'Invia un altro messaggio',
    errorGeneric: 'Qualcosa è andato storto. Riprovare.',
    errorInvalidEmail: 'Questo indirizzo e-mail non è valido. Controllare il dominio.',
    infoTitle: 'Informazioni di contatto',
    infoEmail: 'E-mail',
    infoPhone: 'Telefono',
    defaultEmail: 'info@gjej-pune.com',
    defaultPhone: '+41 44 000 00 00',
    hours: 'Orari di apertura',
    hoursValue: 'Lun–Ven: 09:00–18:00',
  },
  sq: {
    pageTitle: 'Kontakti',
    pageSubtitle: 'Keni pyetje ose sugjerime? Ne presim mesazhin tuaj me padurim.',
    nameLabel: 'Emri i plotë',
    namePlaceholder: 'Filan Fisteku',
    emailLabel: 'Adresa e emailit',
    emailPlaceholder: 'emri@shembull.com',
    phoneLabel: 'Telefoni (opsional)',
    phonePlaceholder: '+41 79 123 45 67',
    subjectLabel: 'Subjekti',
    subjectPlaceholder: 'Si mund t\'ju ndihmojmë?',
    messageLabel: 'Mesazhi juaj',
    messagePlaceholder: 'Përshkruani kërkesën tuaj...',
    submit: 'Dërgo mesazhin',
    sending: 'Duke dërguar…',
    successTitle: 'Mesazhi u dërgua!',
    successDesc: 'Faleminderit për mesazhin tuaj. Do t\'ju përgjigjemi sa më shpejt të jetë e mundur.',
    sendAnother: 'Dërgo një mesazh tjetër',
    errorGeneric: 'Diçka shkoi keq. Ju lutem provoni përsëri.',
    errorInvalidEmail: 'Kjo adresë emaili nuk është e vlefshme. Ju lutem kontrolloni domenin.',
    infoTitle: 'Informacione kontakti',
    infoEmail: 'Email',
    infoPhone: 'Telefon',
    defaultEmail: 'info@gjej-pune.com',
    defaultPhone: '+41 44 000 00 00',
    hours: 'Orari i punës',
    hoursValue: 'Hën–Pre: 09:00–18:00',
  },
} as const;

interface CmsContactData {
  email?: string;
  phone?: string;
  hours?: string;
}

export default function ContactPage() {
  const locale = useLocale() as keyof typeof ui;
  const t = ui[locale] ?? ui.de;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [cmsData, setCmsData] = useState<CmsContactData>({});

  useEffect(() => {
    fetch(`${API_URL}/api/cms/content/Contact?locale=${locale}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.content) {
          const d: CmsContactData = {};
          for (const item of data.content) {
            (d as any)[item.fieldKey] = item.value;
          }
          setCmsData(d);
        }
      })
      .catch(() => {});
  }, [locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (data.ok) {
        setSuccess(true);
      } else if (data.error === 'invalidEmail') {
        setError(t.errorInvalidEmail);
      } else {
        setError(t.errorGeneric);
      }
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName(''); setEmail(''); setSubject(''); setMessage('');
    setSuccess(false); setError('');
  };

  const inputCls = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-[#0B1F44] placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#162C66]/10 focus:border-[#162C66]/30 outline-none transition-all";

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0F1E45] via-[#162C66] to-[#1a3570]">
          <div className="absolute inset-0">
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#F5C400]/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-28">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full mb-8">
                <Mail size={14} className="text-[#F5C400]" />
                <span className="text-white/80 text-sm font-semibold tracking-wide">{t.pageTitle}</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-6 leading-[1.1]">
                {t.pageTitle}
              </h1>
              <p className="text-lg sm:text-xl text-white/60 font-medium max-w-2xl mx-auto leading-relaxed">
                {t.pageSubtitle}
              </p>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
              <path d="M0 60V30C240 0 480 0 720 15C960 30 1200 45 1440 30V60H0Z" fill="#F8FAFC" />
            </svg>
          </div>
        </section>

        {/* ── Contact Info Cards ── */}
        <section className="bg-[#F8FAFC] pt-4 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 flex items-start gap-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <Mail size={20} className="text-[#162C66]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t.infoEmail}</p>
                  <a href={`mailto:${cmsData.email || t.defaultEmail}`} className="text-sm font-bold text-[#162C66] hover:underline break-all">
                    {cmsData.email || t.defaultEmail}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Form Section ── */}
        <section className="bg-[#F8FAFC] pb-16 sm:pb-20 lg:pb-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-[1fr_400px] gap-10 lg:gap-14">

              {/* Contact Form */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                {success ? (
                  <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
                    <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 size={40} className="text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-[#0B1F44] mb-3">{t.successTitle}</h2>
                    <p className="text-sm text-slate-500 font-medium max-w-sm mb-8 leading-relaxed">{t.successDesc}</p>
                    <button
                      onClick={resetForm}
                      className="px-8 py-3.5 bg-[#162C66] text-white text-sm font-bold rounded-xl hover:bg-[#0F1E45] transition-all shadow-lg shadow-[#162C66]/15"
                    >
                      {t.sendAnother}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="p-6 sm:p-8 lg:p-10 border-b border-slate-100">
                      <h2 className="text-xl font-extrabold text-[#0B1F44]">
                        {t.pageTitle}
                      </h2>
                      <p className="text-sm text-slate-400 font-medium mt-1">* = {locale === 'de' ? 'Pflichtfeld' : locale === 'fr' ? 'Champ obligatoire' : 'Required'}</p>
                    </div>

                    <div className="p-6 sm:p-8 lg:p-10 space-y-5">
                      {error && (
                        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-[13px] font-semibold text-red-600 flex items-center gap-2">
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                          {error}
                        </div>
                      )}

                      <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            {t.nameLabel} <span className="text-red-400">*</span>
                          </label>
                          <div className="relative">
                            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t.namePlaceholder} required className={clsx(inputCls, 'pl-11')} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            {t.emailLabel} <span className="text-red-400">*</span>
                          </label>
                          <div className="relative">
                            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t.emailPlaceholder} required className={clsx(inputCls, 'pl-11')} />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          {t.subjectLabel}
                        </label>
                        <div className="relative">
                          <FileText size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder={t.subjectPlaceholder} className={clsx(inputCls, 'pl-11')} />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          {t.messageLabel} <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          value={message}
                          onChange={e => setMessage(e.target.value)}
                          placeholder={t.messagePlaceholder}
                          required
                          rows={6}
                          className={clsx(inputCls, 'resize-y')}
                        />
                      </div>
                    </div>

                    <div className="px-6 sm:px-8 lg:px-10 py-5 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                      <button
                        type="submit"
                        disabled={loading || !name.trim() || !email.trim() || !message.trim()}
                        className="px-8 py-3.5 bg-[#162C66] text-white text-[15px] font-bold rounded-xl hover:bg-[#0F1E45] transition-all shadow-lg shadow-[#162C66]/15 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2.5 hover:-translate-y-0.5"
                      >
                        {loading ? (
                          <><Loader2 size={18} className="animate-spin" />{t.sending}</>
                        ) : (
                          <><Send size={18} />{t.submit}</>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Hours Card */}
                <div className="bg-gradient-to-br from-[#162C66] to-[#0F1E45] rounded-2xl p-7 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#F5C400]/10 rounded-full blur-2xl" />
                  <div className="relative">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-5">
                      <svg width="22" height="22" fill="none" stroke="#F5C400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                    <h4 className="font-extrabold text-lg text-white mb-2">{t.hours}</h4>
                    <p className="text-white/60 text-sm font-semibold">{cmsData.hours || t.hoursValue}</p>
                  </div>
                </div>

                {/* Quick Info Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-7">
                  <h4 className="text-base font-extrabold text-[#0B1F44] mb-5">{t.infoTitle}</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-blue-50/60 rounded-xl">
                      <Mail size={16} className="text-[#162C66] shrink-0" />
                      <a href={`mailto:${cmsData.email || t.defaultEmail}`} className="text-sm font-semibold text-[#162C66] hover:underline truncate">
                        {cmsData.email || t.defaultEmail}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Response Time Card */}
                <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-7">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-sm font-bold text-emerald-600">
                      {locale === 'de' ? 'Antwortzeit' : locale === 'fr' ? 'Temps de réponse' : locale === 'it' ? 'Tempo di risposta' : locale === 'sq' ? 'Koha e përgjigjes' : 'Response time'}
                    </span>
                  </div>
                  <p className="text-2xl font-black text-[#0B1F44] mb-1">&lt; 24h</p>
                  <p className="text-xs text-slate-400 font-medium">
                    {locale === 'de' ? 'Durchschnittliche Antwortzeit' : locale === 'fr' ? 'Temps de réponse moyen' : locale === 'it' ? 'Tempo medio di risposta' : locale === 'sq' ? 'Koha mesatare e përgjigjes' : 'Average response time'}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
