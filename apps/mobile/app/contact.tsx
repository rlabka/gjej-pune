import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText as FileTextIcon,
  Mail,
  MessageSquare,
  Send,
  User as UserIcon,
} from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';
import { api } from '@/lib/api';

type Locale = 'de' | 'en' | 'fr' | 'it' | 'sq';

const UI: Record<Locale, {
  pageTitle: string;
  pageSubtitle: string;
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  subjectLabel: string;
  subjectPlaceholder: string;
  messageLabel: string;
  messagePlaceholder: string;
  required: string;
  submit: string;
  sending: string;
  successTitle: string;
  successDesc: string;
  sendAnother: string;
  errorGeneric: string;
  errorInvalidEmail: string;
  infoTitle: string;
  infoEmail: string;
  defaultEmail: string;
  hours: string;
  hoursValue: string;
  responseTime: string;
  responseTimeDesc: string;
}> = {
  de: {
    pageTitle: 'Kontakt',
    pageSubtitle: 'Haben Sie Fragen oder Anregungen? Wir freuen uns auf Ihre Nachricht.',
    nameLabel: 'Vollständiger Name',
    namePlaceholder: 'Max Mustermann',
    emailLabel: 'E-Mail-Adresse',
    emailPlaceholder: 'max@beispiel.de',
    subjectLabel: 'Betreff',
    subjectPlaceholder: 'Wie können wir Ihnen helfen?',
    messageLabel: 'Ihre Nachricht',
    messagePlaceholder: 'Beschreiben Sie Ihr Anliegen...',
    required: 'Pflichtfeld',
    submit: 'Nachricht senden',
    sending: 'Wird gesendet…',
    successTitle: 'Nachricht gesendet!',
    successDesc: 'Vielen Dank für Ihre Nachricht. Wir melden uns so schnell wie möglich bei Ihnen.',
    sendAnother: 'Weitere Nachricht senden',
    errorGeneric: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.',
    errorInvalidEmail: 'Diese E-Mail-Adresse ist ungültig.',
    infoTitle: 'Kontaktinformationen',
    infoEmail: 'E-Mail',
    defaultEmail: 'info@gjej-pune.com',
    hours: 'Öffnungszeiten',
    hoursValue: 'Mo–Fr: 09:00–18:00',
    responseTime: 'Antwortzeit',
    responseTimeDesc: 'Durchschnittliche Antwortzeit',
  },
  en: {
    pageTitle: 'Contact',
    pageSubtitle: 'Have questions or suggestions? We look forward to your message.',
    nameLabel: 'Full name',
    namePlaceholder: 'John Doe',
    emailLabel: 'Email address',
    emailPlaceholder: 'john@example.com',
    subjectLabel: 'Subject',
    subjectPlaceholder: 'How can we help you?',
    messageLabel: 'Your message',
    messagePlaceholder: 'Describe your request...',
    required: 'Required',
    submit: 'Send message',
    sending: 'Sending…',
    successTitle: 'Message sent!',
    successDesc: 'Thank you for your message. We will get back to you as soon as possible.',
    sendAnother: 'Send another message',
    errorGeneric: 'Something went wrong. Please try again.',
    errorInvalidEmail: 'This email address is invalid.',
    infoTitle: 'Contact Information',
    infoEmail: 'Email',
    defaultEmail: 'info@gjej-pune.com',
    hours: 'Business hours',
    hoursValue: 'Mon–Fri: 09:00–18:00',
    responseTime: 'Response time',
    responseTimeDesc: 'Average response time',
  },
  fr: {
    pageTitle: 'Contact',
    pageSubtitle: 'Des questions ou suggestions ? Nous attendons votre message avec impatience.',
    nameLabel: 'Nom complet',
    namePlaceholder: 'Jean Dupont',
    emailLabel: 'Adresse e-mail',
    emailPlaceholder: 'jean@exemple.fr',
    subjectLabel: 'Objet',
    subjectPlaceholder: 'Comment pouvons-nous vous aider ?',
    messageLabel: 'Votre message',
    messagePlaceholder: 'Décrivez votre demande...',
    required: 'Champ obligatoire',
    submit: 'Envoyer le message',
    sending: 'Envoi…',
    successTitle: 'Message envoyé !',
    successDesc: 'Merci pour votre message. Nous vous répondrons dans les plus brefs délais.',
    sendAnother: 'Envoyer un autre message',
    errorGeneric: 'Une erreur s\'est produite. Veuillez réessayer.',
    errorInvalidEmail: 'Cette adresse e-mail est invalide.',
    infoTitle: 'Informations de contact',
    infoEmail: 'E-mail',
    defaultEmail: 'info@gjej-pune.com',
    hours: 'Heures d\'ouverture',
    hoursValue: 'Lun–Ven : 09:00–18:00',
    responseTime: 'Temps de réponse',
    responseTimeDesc: 'Temps de réponse moyen',
  },
  it: {
    pageTitle: 'Contatto',
    pageSubtitle: 'Avete domande o suggerimenti? Non vediamo l\'ora di ricevere il vostro messaggio.',
    nameLabel: 'Nome completo',
    namePlaceholder: 'Mario Rossi',
    emailLabel: 'Indirizzo e-mail',
    emailPlaceholder: 'mario@esempio.it',
    subjectLabel: 'Oggetto',
    subjectPlaceholder: 'Come possiamo aiutarvi?',
    messageLabel: 'Il vostro messaggio',
    messagePlaceholder: 'Descrivete la vostra richiesta...',
    required: 'Obbligatorio',
    submit: 'Invia messaggio',
    sending: 'Invio…',
    successTitle: 'Messaggio inviato!',
    successDesc: 'Grazie per il vostro messaggio. Vi risponderemo il prima possibile.',
    sendAnother: 'Invia un altro messaggio',
    errorGeneric: 'Qualcosa è andato storto. Riprovare.',
    errorInvalidEmail: 'Questo indirizzo e-mail non è valido.',
    infoTitle: 'Informazioni di contatto',
    infoEmail: 'E-mail',
    defaultEmail: 'info@gjej-pune.com',
    hours: 'Orari di apertura',
    hoursValue: 'Lun–Ven: 09:00–18:00',
    responseTime: 'Tempo di risposta',
    responseTimeDesc: 'Tempo medio di risposta',
  },
  sq: {
    pageTitle: 'Kontakti',
    pageSubtitle: 'Keni pyetje ose sugjerime? Ne presim mesazhin tuaj me padurim.',
    nameLabel: 'Emri i plotë',
    namePlaceholder: 'Filan Fisteku',
    emailLabel: 'Adresa e emailit',
    emailPlaceholder: 'emri@shembull.com',
    subjectLabel: 'Subjekti',
    subjectPlaceholder: 'Si mund t\'ju ndihmojmë?',
    messageLabel: 'Mesazhi juaj',
    messagePlaceholder: 'Përshkruani kërkesën tuaj...',
    required: 'I detyrueshëm',
    submit: 'Dërgo mesazhin',
    sending: 'Duke dërguar…',
    successTitle: 'Mesazhi u dërgua!',
    successDesc: 'Faleminderit për mesazhin tuaj. Do t\'ju përgjigjemi sa më shpejt të jetë e mundur.',
    sendAnother: 'Dërgo një mesazh tjetër',
    errorGeneric: 'Diçka shkoi keq. Ju lutem provoni përsëri.',
    errorInvalidEmail: 'Kjo adresë emaili nuk është e vlefshme.',
    infoTitle: 'Informacione kontakti',
    infoEmail: 'Email',
    defaultEmail: 'info@gjej-pune.com',
    hours: 'Orari i punës',
    hoursValue: 'Hën–Pre: 09:00–18:00',
    responseTime: 'Koha e përgjigjes',
    responseTimeDesc: 'Koha mesatare e përgjigjes',
  },
};

type CmsContactData = {
  email?: string;
  hours?: string;
};

type CmsContent = { ok: boolean; content?: { fieldKey: string; value: string }[] };
type ContactRes = { ok: boolean; error?: string };

export default function ContactScreen() {
  const router = useRouter();
  const { locale } = useI18n();
  const l: Locale = (['de', 'en', 'fr', 'it', 'sq'] as const).includes(locale as Locale)
    ? (locale as Locale)
    : 'sq';
  const ui = UI[l];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [cms, setCms] = useState<CmsContactData>({});

  // Load CMS contact info
  useEffect(() => {
    api
      .get<CmsContent>(`/api/cms/content/Contact?locale=${l}`)
      .then((res) => {
        if (res?.ok && res.content) {
          const d: CmsContactData = {};
          for (const item of res.content) {
            (d as any)[item.fieldKey] = item.value;
          }
          setCms(d);
        }
      })
      .catch(() => {});
  }, [l]);

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    message.trim().length > 0 &&
    !loading;

  async function onSubmit() {
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    try {
      const data = await api.post<ContactRes>('/api/contact', {
        name,
        email,
        subject,
        message,
      });
      if (data?.ok) {
        setSuccess(true);
      } else if (data?.error === 'invalidEmail') {
        setError(ui.errorInvalidEmail);
      } else {
        setError(ui.errorGeneric);
      }
    } catch {
      setError(ui.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
    setSuccess(false);
    setError('');
  }

  const contactEmail = cms.email || ui.defaultEmail;
  const contactHours = cms.hours || ui.hoursValue;

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* Hero header (navy) */}
      <View className="bg-[#162C66] pb-10">
        <SafeAreaView edges={['top']}>
          <View className="flex-row items-center px-4 pt-2">
            <Pressable
              onPress={() => router.back()}
              className="h-9 w-9 items-center justify-center rounded-xl active:opacity-70"
            >
              <ArrowLeft color="#FFFFFF" size={22} />
            </Pressable>
          </View>

          <View className="items-center px-6 pt-4">
            <View className="flex-row items-center rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
              <Mail color="#F5C400" size={12} />
              <Text className="ml-1.5 text-[11px] font-bold uppercase tracking-wider text-white/80">
                {ui.pageTitle}
              </Text>
            </View>
            <Text className="mt-4 text-center text-[32px] font-black leading-[1.1] tracking-tight text-white">
              {ui.pageTitle}
            </Text>
            <Text className="mt-3 max-w-[300px] text-center text-[14px] leading-relaxed text-white/60">
              {ui.pageSubtitle}
            </Text>
          </View>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 -mt-6"
          contentContainerStyle={{ paddingBottom: 80 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Email contact card */}
          <View className="mx-5">
            <Pressable
              onPress={() => Linking.openURL(`mailto:${contactEmail}`)}
              className="flex-row items-center rounded-2xl border border-slate-200 bg-white p-4 active:opacity-90"
              style={{
                shadowColor: '#0B1F44',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
                elevation: 3,
              }}
            >
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                <Mail color="#162C66" size={20} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  {ui.infoEmail}
                </Text>
                <Text
                  className="mt-0.5 text-[14px] font-extrabold text-[#162C66]"
                  numberOfLines={1}
                >
                  {contactEmail}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Form / Success card */}
          <View
            className="mx-5 mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white"
            style={{
              shadowColor: '#0B1F44',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.06,
              shadowRadius: 14,
              elevation: 3,
            }}
          >
            {success ? (
              <View className="items-center px-6 py-12">
                <View className="h-20 w-20 items-center justify-center rounded-2xl bg-emerald-50">
                  <CheckCircle2 color="#10B981" size={40} />
                </View>
                <Text className="mt-5 text-center text-[20px] font-extrabold text-[#0B1F44]">
                  {ui.successTitle}
                </Text>
                <Text className="mt-2 max-w-[280px] text-center text-[13px] leading-relaxed text-slate-500">
                  {ui.successDesc}
                </Text>
                <Pressable
                  onPress={reset}
                  className="mt-6 rounded-xl bg-[#162C66] px-7 py-3.5 active:opacity-90"
                >
                  <Text className="text-[14px] font-extrabold text-white">
                    {ui.sendAnother}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View>
                <View className="border-b border-slate-100 p-5">
                  <Text className="text-[18px] font-extrabold text-[#0B1F44]">
                    {ui.pageTitle}
                  </Text>
                  <Text className="mt-1 text-[12px] font-medium text-slate-400">
                    * = {ui.required}
                  </Text>
                </View>

                <View className="p-5" style={{ gap: 14 }}>
                  {error ? (
                    <View className="flex-row items-center rounded-xl border border-red-100 bg-red-50 px-3 py-3">
                      <AlertCircle color="#DC2626" size={16} />
                      <Text className="ml-2 flex-1 text-[12px] font-semibold text-red-600">
                        {error}
                      </Text>
                    </View>
                  ) : null}

                  <FormField
                    icon={<UserIcon color="#94A3B8" size={16} />}
                    label={ui.nameLabel}
                    required
                    value={name}
                    onChangeText={setName}
                    placeholder={ui.namePlaceholder}
                    autoCapitalize="words"
                  />

                  <FormField
                    icon={<Mail color="#94A3B8" size={16} />}
                    label={ui.emailLabel}
                    required
                    value={email}
                    onChangeText={setEmail}
                    placeholder={ui.emailPlaceholder}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <FormField
                    icon={<FileTextIcon color="#94A3B8" size={16} />}
                    label={ui.subjectLabel}
                    value={subject}
                    onChangeText={setSubject}
                    placeholder={ui.subjectPlaceholder}
                  />

                  <View>
                    <Text className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      {ui.messageLabel} <Text className="text-red-400">*</Text>
                    </Text>
                    <View className="rounded-xl border border-slate-200 bg-slate-50">
                      <TextInput
                        value={message}
                        onChangeText={setMessage}
                        placeholder={ui.messagePlaceholder}
                        placeholderTextColor="#94A3B8"
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
                        className="px-4 py-3 text-[14px] text-[#0B1F44]"
                        style={{ minHeight: 130 }}
                      />
                    </View>
                  </View>
                </View>

                <View className="border-t border-slate-100 bg-slate-50/50 p-5">
                  <Pressable
                    onPress={onSubmit}
                    disabled={!canSubmit}
                    className="flex-row items-center justify-center rounded-xl bg-[#162C66] py-4 active:opacity-90 disabled:opacity-40"
                    style={
                      canSubmit
                        ? {
                            shadowColor: '#162C66',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.2,
                            shadowRadius: 10,
                            elevation: 3,
                          }
                        : undefined
                    }
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Send color="#FFFFFF" size={16} strokeWidth={2.5} />
                    )}
                    <Text className="ml-2 text-[15px] font-extrabold text-white">
                      {loading ? ui.sending : ui.submit}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* Hours card */}
          <View className="mx-5 mt-4">
            <View
              className="overflow-hidden rounded-2xl bg-[#0B1F44] p-5"
              style={{
                shadowColor: '#0B1F44',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 3,
              }}
            >
              <View className="flex-row items-center">
                <View className="h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                  <Clock color="#F5C400" size={20} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-[15px] font-extrabold text-white">
                    {ui.hours}
                  </Text>
                  <Text className="mt-0.5 text-[13px] font-semibold text-white/60">
                    {contactHours}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Response time card */}
          <View className="mx-5 mt-4 rounded-2xl border border-slate-200 bg-white p-5">
            <View className="flex-row items-center">
              <View className="h-2 w-2 rounded-full bg-emerald-400" />
              <Text className="ml-2 text-[12px] font-bold text-emerald-600">
                {ui.responseTime}
              </Text>
            </View>
            <View className="mt-2 flex-row items-baseline">
              <Text className="text-[28px] font-black text-[#0B1F44]">&lt; 24h</Text>
            </View>
            <Text className="mt-1 text-[11px] font-medium text-slate-400">
              {ui.responseTimeDesc}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function FormField({
  icon,
  label,
  required,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
}: {
  icon: React.ReactNode;
  label: string;
  required?: boolean;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words';
}) {
  return (
    <View>
      <Text className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
        {label} {required ? <Text className="text-red-400">*</Text> : null}
      </Text>
      <View className="flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-3">
        {icon}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          className="ml-2 flex-1 py-3 text-[14px] text-[#0B1F44]"
        />
      </View>
    </View>
  );
}
