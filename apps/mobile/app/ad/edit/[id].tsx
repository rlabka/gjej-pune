import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Briefcase,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Globe2,
  Languages as LangIcon,
  MapPin,
  Phone,
  Save,
  Sparkles,
  User as UserIcon,
} from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { resolveMediaUrl } from '@/lib/useApi';
import { config } from '@/lib/config';
import { JobCategoryPicker } from '@/components/JobCategoryPicker';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';

type Locale = 'de' | 'en' | 'fr' | 'it' | 'sq';

const COPY: Record<Locale, {
  title: string;
  saveBtn: string;
  saving: string;
  jobCategory: string;
  jobCategoryPh: string;
  yourInfo: string;
  yourInfoDesc: string;
  firstName: string;
  surname: string;
  surnameHint: string;
  phone: string;
  phoneHint: string;
  age: string;
  agePh: string;
  photoSection: string;
  photoHint: string;
  experience: string;
  experiencePh: string;
  livingPlace: string;
  livingPlacePh: string;
  languages: string;
  languagesHint: string;
  skills: string;
  skillsHint: string;
  selectedCount: (current: number, total: number) => string;
  experienceOpts: string[];
  predefinedSkills: string[];
  errSkills: string;
  errLanguages: string;
}> = {
  de: {
    title: 'Profil bearbeiten',
    saveBtn: 'Änderungen speichern',
    saving: 'Speichern…',
    jobCategory: 'Jobkategorie',
    jobCategoryPh: 'Jobkategorie auswählen…',
    yourInfo: 'Deine Informationen',
    yourInfoDesc: 'Diese Daten erscheinen in deinem Profil.',
    firstName: 'Vorname',
    surname: 'Nachname',
    surnameHint: '(versteckt)',
    phone: 'Telefon',
    phoneHint: '(versteckt)',
    age: 'Alter',
    agePh: 'Dein Alter',
    photoSection: 'Profilfoto',
    photoHint: 'Profile mit Foto erhalten deutlich mehr Anfragen.',
    experience: 'Berufserfahrung',
    experiencePh: 'Auswählen…',
    livingPlace: 'Wohnort',
    livingPlacePh: 'Stadt oder Region',
    languages: 'Sprachkenntnisse',
    languagesHint: 'Welche Sprachen sprichst du? Wähle mindestens eine.',
    skills: 'Ich bin…',
    skillsHint: 'Wähle genau 3 Eigenschaften, die dich am besten beschreiben.',
    selectedCount: (a, b) => `${a} von ${b} ausgewählt`,
    experienceOpts: ['< 1 Jahr', '1 Jahr', '2 Jahre', '3 Jahre', '4 Jahre', '5 Jahre', '5+ Jahre', '10+ Jahre'],
    predefinedSkills: ['Kommunikativ', 'Geduldig', 'Verantwortungsbewusst', 'Professionell', 'Stressresistent', 'Empathisch', 'Teamfähig', 'Zuverlässig', 'Flexibel', 'Motiviert', 'Organisiert', 'Kreativ', 'Belastbar', 'Lösungsorientiert', 'Selbstständig', 'Freundlich', 'Sorgfältig', 'Engagiert', 'Hilfsbereit', 'Lernbereit'],
    errSkills: 'Bitte genau 3 Eigenschaften auswählen.',
    errLanguages: 'Bitte mindestens eine Sprache auswählen.',
  },
  en: {
    title: 'Edit profile',
    saveBtn: 'Save changes',
    saving: 'Saving…',
    jobCategory: 'Job category',
    jobCategoryPh: 'Select a job category…',
    yourInfo: 'Your information',
    yourInfoDesc: 'These details appear on your profile.',
    firstName: 'First name',
    surname: 'Surname',
    surnameHint: '(hidden)',
    phone: 'Phone',
    phoneHint: '(hidden)',
    age: 'Age',
    agePh: 'Your age',
    photoSection: 'Profile photo',
    photoHint: 'Profiles with a photo get significantly more messages.',
    experience: 'Years of experience',
    experiencePh: 'Select…',
    livingPlace: 'Living place',
    livingPlacePh: 'City or region',
    languages: 'Languages spoken',
    languagesHint: 'Which languages do you speak? Select at least one.',
    skills: 'I am…',
    skillsHint: 'Choose exactly 3 traits that describe you best.',
    selectedCount: (a, b) => `${a} of ${b} selected`,
    experienceOpts: ['< 1 year', '1 year', '2 years', '3 years', '4 years', '5 years', '5+ years', '10+ years'],
    predefinedSkills: ['Communicative', 'Patient', 'Responsible', 'Professional', 'Stress-resistant', 'Empathetic', 'Team player', 'Reliable', 'Flexible', 'Motivated', 'Organized', 'Creative', 'Resilient', 'Solution-oriented', 'Independent', 'Friendly', 'Careful', 'Engaged', 'Helpful', 'Eager to learn'],
    errSkills: 'Please select exactly 3 traits.',
    errLanguages: 'Please select at least one language.',
  },
  fr: {
    title: 'Modifier le profil',
    saveBtn: 'Enregistrer',
    saving: 'Enregistrement…',
    jobCategory: 'Catégorie de poste',
    jobCategoryPh: 'Sélectionner…',
    yourInfo: 'Vos informations',
    yourInfoDesc: 'Ces informations apparaissent sur votre profil.',
    firstName: 'Prénom',
    surname: 'Nom',
    surnameHint: '(caché)',
    phone: 'Téléphone',
    phoneHint: '(caché)',
    age: 'Âge',
    agePh: 'Votre âge',
    photoSection: 'Photo de profil',
    photoHint: 'Les profils avec photo reçoivent beaucoup plus de messages.',
    experience: "Années d'expérience",
    experiencePh: 'Sélectionner…',
    livingPlace: 'Lieu de résidence',
    livingPlacePh: 'Ville ou région',
    languages: 'Langues parlées',
    languagesHint: 'Quelles langues parlez-vous ? Sélectionnez au moins une.',
    skills: 'Je suis…',
    skillsHint: 'Choisissez exactement 3 qualités qui vous décrivent.',
    selectedCount: (a, b) => `${a} sur ${b} sélectionnés`,
    experienceOpts: ['< 1 an', '1 an', '2 ans', '3 ans', '4 ans', '5 ans', '5+ ans', '10+ ans'],
    predefinedSkills: ['Communicatif', 'Patient', 'Responsable', 'Professionnel', 'Résistant au stress', 'Empathique', 'Esprit équipe', 'Fiable', 'Flexible', 'Motivé', 'Organisé', 'Créatif', 'Résilient', 'Orienté solutions', 'Autonome', 'Aimable', 'Soigneux', 'Engagé', 'Serviable', "Désireux d'apprendre"],
    errSkills: 'Veuillez sélectionner exactement 3 qualités.',
    errLanguages: 'Veuillez sélectionner au moins une langue.',
  },
  it: {
    title: 'Modifica profilo',
    saveBtn: 'Salva modifiche',
    saving: 'Salvataggio…',
    jobCategory: 'Categoria lavoro',
    jobCategoryPh: 'Seleziona…',
    yourInfo: 'Le tue informazioni',
    yourInfoDesc: 'Questi dati appaiono nel tuo profilo.',
    firstName: 'Nome',
    surname: 'Cognome',
    surnameHint: '(nascosto)',
    phone: 'Telefono',
    phoneHint: '(nascosto)',
    age: 'Età',
    agePh: 'La tua età',
    photoSection: 'Foto profilo',
    photoHint: 'I profili con foto ricevono molti più messaggi.',
    experience: 'Anni di esperienza',
    experiencePh: 'Seleziona…',
    livingPlace: 'Luogo',
    livingPlacePh: 'Città o regione',
    languages: 'Lingue parlate',
    languagesHint: 'Quali lingue parli? Seleziona almeno una.',
    skills: 'Sono…',
    skillsHint: 'Scegli esattamente 3 qualità che ti descrivono.',
    selectedCount: (a, b) => `${a} di ${b} selezionati`,
    experienceOpts: ['< 1 anno', '1 anno', '2 anni', '3 anni', '4 anni', '5 anni', '5+ anni', '10+ anni'],
    predefinedSkills: ['Comunicativo', 'Paziente', 'Responsabile', 'Professionale', 'Resistente allo stress', 'Empatico', 'Spirito di squadra', 'Affidabile', 'Flessibile', 'Motivato', 'Organizzato', 'Creativo', 'Resiliente', 'Orientato alle soluzioni', 'Indipendente', 'Cordiale', 'Accurato', 'Coinvolto', 'Disponibile', 'Voglioso di imparare'],
    errSkills: 'Seleziona esattamente 3 qualità.',
    errLanguages: 'Seleziona almeno una lingua.',
  },
  sq: {
    title: 'Ndrysho profilin',
    saveBtn: 'Ruaj ndryshimet',
    saving: 'Duke ruajtur…',
    jobCategory: 'Kategoria e punës',
    jobCategoryPh: 'Zgjidhni kategorinë…',
    yourInfo: 'Informacionet tuaja',
    yourInfoDesc: 'Këto të dhëna shfaqen në profilin tënd.',
    firstName: 'Emri',
    surname: 'Mbiemri',
    surnameHint: '(i fshehur)',
    phone: 'Telefoni',
    phoneHint: '(i fshehur)',
    age: 'Mosha',
    agePh: 'Mosha jote',
    photoSection: 'Foto e profilit',
    photoHint: 'Profilet me foto marrin shumë më shumë mesazhe.',
    experience: 'Vitet e përvojës',
    experiencePh: 'Zgjidhni…',
    livingPlace: 'Vendbanimi',
    livingPlacePh: 'Qyteti ose rajoni',
    languages: 'Gjuhët e folura',
    languagesHint: 'Cilat gjuhë flisni? Zgjidhni të paktën një.',
    skills: 'Unë jam…',
    skillsHint: 'Zgjidhni saktësisht 3 cilësi që ju përshkruajnë më mirë.',
    selectedCount: (a, b) => `${a} nga ${b} të zgjedhura`,
    experienceOpts: ['< 1 vit', '1 vit', '2 vite', '3 vite', '4 vite', '5 vite', '5+ vite', '10+ vite'],
    predefinedSkills: ['Komunikues', 'I durueshëm', 'I përgjegjshëm', 'Profesional', 'Rezistent ndaj stresit', 'Empatik', 'Punë në ekip', 'I besueshëm', 'Fleksibël', 'I motivuar', 'I organizuar', 'Kreativ', 'Rezistent', 'I orientuar në zgjidhje', 'Pavarur', 'Miqësor', 'I kujdesshëm', 'I përkushtuar', 'Ndihmues', 'I gatshëm për të mësuar'],
    errSkills: 'Ju lutem zgjidhni saktësisht 3 cilësi.',
    errLanguages: 'Ju lutem zgjidhni të paktën një gjuhë.',
  },
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

const LANG_NAMES: Record<Locale, Record<string, string>> = {
  de: { sq: 'Albanisch', de: 'Deutsch', en: 'Englisch', fr: 'Französisch', it: 'Italienisch', el: 'Griechisch', tr: 'Türkisch', sr: 'Serbisch', mk: 'Mazedonisch', es: 'Spanisch', pt: 'Portugiesisch', ro: 'Rumänisch', pl: 'Polnisch', nl: 'Niederländisch', ru: 'Russisch', ar: 'Arabisch' },
  en: { sq: 'Albanian', de: 'German', en: 'English', fr: 'French', it: 'Italian', el: 'Greek', tr: 'Turkish', sr: 'Serbian', mk: 'Macedonian', es: 'Spanish', pt: 'Portuguese', ro: 'Romanian', pl: 'Polish', nl: 'Dutch', ru: 'Russian', ar: 'Arabic' },
  fr: { sq: 'Albanais', de: 'Allemand', en: 'Anglais', fr: 'Français', it: 'Italien', el: 'Grec', tr: 'Turc', sr: 'Serbe', mk: 'Macédonien', es: 'Espagnol', pt: 'Portugais', ro: 'Roumain', pl: 'Polonais', nl: 'Néerlandais', ru: 'Russe', ar: 'Arabe' },
  it: { sq: 'Albanese', de: 'Tedesco', en: 'Inglese', fr: 'Francese', it: 'Italiano', el: 'Greco', tr: 'Turco', sr: 'Serbo', mk: 'Macedone', es: 'Spagnolo', pt: 'Portoghese', ro: 'Rumeno', pl: 'Polacco', nl: 'Olandese', ru: 'Russo', ar: 'Arabo' },
  sq: { sq: 'Shqip', de: 'Gjermanisht', en: 'Anglisht', fr: 'Frëngjisht', it: 'Italisht', el: 'Greqisht', tr: 'Turqisht', sr: 'Serbisht', mk: 'Maqedonisht', es: 'Spanjisht', pt: 'Portugalisht', ro: 'Rumanisht', pl: 'Polonisht', nl: 'Holandisht', ru: 'Rusisht', ar: 'Arabisht' },
};

function parseList(value: string[] | string | null | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export default function EditAdScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { locale } = useI18n();
  const l: Locale = (['de', 'en', 'fr', 'it', 'sq'] as const).includes(
    locale as Locale
  )
    ? (locale as Locale)
    : 'sq';
  const c = COPY[l];

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('');
  const [age, setAge] = useState('');
  const [experience, setExperience] = useState('');
  const [livingPlace, setLivingPlace] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [newPhoto, setNewPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const [expOpen, setExpOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = (await getToken()) ?? undefined;
        const res = await api.get<{ ok: boolean; ad: any }>(
          `/api/ads/${id}`,
          token
        );
        if (res?.ok && res.ad) {
          const ad = res.ad;
          setFirstName(ad.firstName ?? '');
          setSurname(ad.surname ?? '');
          setPhone(ad.phone ?? '');
          setCategory(ad.category ?? '');
          setAge(ad.age != null ? String(ad.age) : '');
          setExperience(ad.experience ?? '');
          setLivingPlace(ad.livingPlace ?? '');
          setSkills(parseList(ad.skills));
          setLanguages(parseList(ad.spokenLanguages));
          setPhotoUrl(ad.photoUrl ?? null);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function pickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets?.[0]) setNewPhoto(result.assets[0]);
  }

  function toggleLanguage(code: string) {
    setLanguages((prev) =>
      prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code]
    );
  }

  function toggleSkill(skill: string) {
    setSkills((prev) => {
      if (prev.includes(skill)) return prev.filter((s) => s !== skill);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, skill];
    });
  }

  const completion = useMemo(() => {
    let score = 0;
    if (category) score++;
    if (firstName) score++;
    if (phone) score++;
    if (experience) score++;
    if (livingPlace) score++;
    if (languages.length >= 1) score++;
    if (skills.length === 3) score++;
    if (newPhoto || photoUrl) score++;
    return Math.round((score / 8) * 100);
  }, [
    category,
    firstName,
    phone,
    experience,
    livingPlace,
    languages.length,
    skills.length,
    newPhoto,
    photoUrl,
  ]);

  async function onSubmit() {
    if (!firstName || !surname || !phone || !category) {
      Alert.alert(c.title, 'Bitte alle Pflichtfelder ausfüllen.');
      return;
    }
    if (languages.length < 1) {
      Alert.alert(c.languages, c.errLanguages);
      return;
    }
    if (skills.length !== 3) {
      Alert.alert(c.skills, c.errSkills);
      return;
    }
    setSubmitting(true);
    try {
      const token = (await getToken()) ?? undefined;
      const payload = {
        firstName,
        surname,
        phone,
        category,
        age: age ? Number(age) : null,
        experience: experience || null,
        livingPlace: livingPlace || null,
        skills,
        spokenLanguages: languages,
      };
      const res = await api.put<{ ok: boolean }>(
        `/api/ads/${id}`,
        payload,
        token
      );
      if (!res?.ok) throw new Error('update failed');

      if (newPhoto) {
        const form = new FormData();
        form.append('photo', {
          uri: newPhoto.uri,
          name: newPhoto.fileName ?? `photo-${Date.now()}.jpg`,
          type: newPhoto.mimeType ?? 'image/jpeg',
        } as any);
        await api.upload(`/api/ads/${id}/photo`, form, token);
      }

      router.back();
    } catch {
      Alert.alert(c.title, 'Fehler beim Speichern.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#162C66" />
        </View>
      </SafeAreaView>
    );
  }

  const displayPhoto = newPhoto?.uri ?? resolveMediaUrl(config.apiUrl, photoUrl);

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* Top bar */}
      <SafeAreaView edges={['top']} className="bg-white">
        <View className="flex-row items-center justify-between border-b border-slate-200/60 px-4 py-3">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full active:bg-slate-50"
          >
            <ArrowLeft color="#0B1F44" size={20} />
          </Pressable>
          <Text className="text-[16px] font-extrabold tracking-tight text-[#0B1F44]">
            {c.title}
          </Text>
          <View className="h-10 w-10 items-center justify-center">
            <Text className="text-[12px] font-extrabold text-[#162C66]">
              {completion}%
            </Text>
          </View>
        </View>
        {/* Progress bar */}
        <View className="h-1 bg-slate-100">
          <View
            className="h-1 bg-[#F5C400]"
            style={{ width: `${completion}%` }}
          />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── Photo ─────────────────────────────────── */}
          <Card>
            <SectionHeader
              icon={<Camera color="#162C66" size={16} />}
              eyebrow={c.photoSection}
              title={c.photoSection}
              required
            />
            <Pressable
              onPress={pickImage}
              className="mt-3 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 py-7 active:opacity-90"
            >
              {displayPhoto ? (
                <View className="relative">
                  <Image
                    source={{ uri: displayPhoto }}
                    style={{ width: 110, height: 110, borderRadius: 55 }}
                  />
                  <View className="absolute -bottom-1 -right-1 h-9 w-9 items-center justify-center rounded-full bg-[#F5C400] border-2 border-white">
                    <Camera color="#162C66" size={14} />
                  </View>
                </View>
              ) : (
                <View className="items-center">
                  <View className="mb-3 h-16 w-16 items-center justify-center rounded-2xl bg-[#162C66]/[0.06]">
                    <Camera color="#162C66" size={28} />
                  </View>
                  <Text className="text-[14px] font-extrabold text-[#0B1F44]">
                    {c.photoSection}
                  </Text>
                </View>
              )}
            </Pressable>
            <Text className="mt-3 text-[12px] leading-relaxed text-slate-500">
              {c.photoHint}
            </Text>
          </Card>

          {/* ─── Job Category ───────────────────────────── */}
          <Card>
            <SectionHeader
              icon={<Briefcase color="#162C66" size={16} />}
              eyebrow={c.jobCategory}
              title={c.jobCategory}
              required
            />
            <View className="mt-3">
              <JobCategoryPicker
                value={category}
                onChange={setCategory}
                placeholder={c.jobCategoryPh}
              />
            </View>
          </Card>

          {/* ─── Personal Info ──────────────────────────── */}
          <Card>
            <SectionHeader
              icon={<UserIcon color="#162C66" size={16} />}
              eyebrow={c.yourInfo}
              title={c.yourInfo}
              subtitle={c.yourInfoDesc}
            />
            <View className="mt-4" style={{ gap: 14 }}>
              <Field
                icon={<UserIcon color="#64748B" size={16} />}
                label={c.firstName}
                required
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
              <Field
                icon={<UserIcon color="#64748B" size={16} />}
                label={`${c.surname} ${c.surnameHint}`}
                required
                value={surname}
                onChangeText={setSurname}
                autoCapitalize="words"
              />
              <Field
                icon={<Phone color="#64748B" size={16} />}
                label={`${c.phone} ${c.phoneHint}`}
                required
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <Field
                icon={<Sparkles color="#64748B" size={16} />}
                label={c.age}
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
                placeholder={c.agePh}
              />
            </View>
          </Card>

          {/* ─── Experience ─────────────────────────────── */}
          <Card>
            <SectionHeader
              icon={<Sparkles color="#162C66" size={16} />}
              eyebrow={c.experience}
              title={c.experience}
              required
            />
            <View className="mt-3">
              <Pressable
                onPress={() => setExpOpen((v) => !v)}
                className="h-[56px] flex-row items-center rounded-xl border border-slate-200 bg-slate-50/80 px-4"
              >
                <Text
                  className={`flex-1 text-[15px] ${
                    experience
                      ? 'font-bold text-[#0B1F44]'
                      : 'font-medium text-slate-400'
                  }`}
                >
                  {experience || c.experiencePh}
                </Text>
                {expOpen ? (
                  <ChevronUp color="#94A3B8" size={18} />
                ) : (
                  <ChevronDown color="#94A3B8" size={18} />
                )}
              </Pressable>
              {expOpen ? (
                <View className="mt-2 flex-row flex-wrap" style={{ gap: 8 }}>
                  {c.experienceOpts.map((opt) => {
                    const active = experience === opt;
                    return (
                      <Pressable
                        key={opt}
                        onPress={() => {
                          setExperience(opt);
                          setExpOpen(false);
                        }}
                        className={`rounded-xl px-3.5 py-2 active:opacity-80 ${
                          active
                            ? 'bg-[#162C66]'
                            : 'border border-slate-200 bg-white'
                        }`}
                      >
                        <Text
                          className={`text-[12px] font-bold ${
                            active ? 'text-white' : 'text-[#0B1F44]'
                          }`}
                        >
                          {opt}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>
          </Card>

          {/* ─── Living Place ───────────────────────────── */}
          <Card>
            <SectionHeader
              icon={<MapPin color="#162C66" size={16} />}
              eyebrow={c.livingPlace}
              title={c.livingPlace}
            />
            <View className="mt-3">
              <LocationAutocomplete
                value={livingPlace}
                onChangeText={setLivingPlace}
                onSelect={(s) => setLivingPlace(s.label)}
                placeholder={c.livingPlacePh}
                variant="light"
              />
            </View>
          </Card>

          {/* ─── Languages ──────────────────────────────── */}
          <Card>
            <SectionHeader
              icon={<Globe2 color="#162C66" size={16} />}
              eyebrow={c.languages}
              title={c.languages}
              required
            />
            <Text className="mt-2 text-[12px] leading-relaxed text-slate-500">
              {c.languagesHint}
            </Text>
            <View className="mt-3 flex-row flex-wrap" style={{ gap: 8 }}>
              {AVAILABLE_LANGUAGES.map((lang) => {
                const active = languages.includes(lang.code);
                return (
                  <Pressable
                    key={lang.code}
                    onPress={() => toggleLanguage(lang.code)}
                    className={`flex-row items-center rounded-xl px-3 py-2 active:opacity-80 ${
                      active
                        ? 'bg-[#162C66]/[0.06] border-2 border-[#162C66]'
                        : 'border border-slate-200 bg-white'
                    }`}
                  >
                    <Text className="text-[14px]">{lang.flag}</Text>
                    <Text
                      className={`ml-1.5 text-[12px] font-bold ${
                        active ? 'text-[#162C66]' : 'text-slate-700'
                      }`}
                    >
                      {LANG_NAMES[l]?.[lang.code] ?? lang.code}
                    </Text>
                    {active ? (
                      <View className="ml-1.5">
                        <Check color="#162C66" size={11} strokeWidth={3} />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
            <View className="mt-3 self-start flex-row items-center rounded-full bg-[#162C66]/[0.06] px-3 py-1">
              <LangIcon color="#162C66" size={11} />
              <Text className="ml-1 text-[11px] font-bold text-[#162C66]">
                {languages.length} {languages.length === 1 ? '/' : '/'} ∞
              </Text>
            </View>
          </Card>

          {/* ─── Skills (pick 3) ────────────────────────── */}
          <Card>
            <SectionHeader
              icon={<Sparkles color="#162C66" size={16} />}
              eyebrow={c.skills}
              title={c.skills}
              required
            />
            <Text className="mt-2 text-[12px] leading-relaxed text-slate-500">
              {c.skillsHint}
            </Text>

            {/* Counter pill */}
            <View
              className={`mt-3 self-start flex-row items-center rounded-full px-3 py-1 ${
                skills.length === 3
                  ? 'bg-emerald-50'
                  : 'bg-[#162C66]/[0.06]'
              }`}
            >
              {skills.length === 3 ? (
                <CheckCircle2 color="#10B981" size={12} />
              ) : (
                <Circle color="#162C66" size={12} />
              )}
              <Text
                className={`ml-1 text-[11px] font-extrabold ${
                  skills.length === 3 ? 'text-emerald-700' : 'text-[#162C66]'
                }`}
              >
                {c.selectedCount(skills.length, 3)}
              </Text>
            </View>

            <View className="mt-3 flex-row flex-wrap" style={{ gap: 8 }}>
              {c.predefinedSkills.map((skill) => {
                const active = skills.includes(skill);
                const disabled = !active && skills.length >= 3;
                return (
                  <Pressable
                    key={skill}
                    onPress={() => toggleSkill(skill)}
                    disabled={disabled}
                    className={`rounded-xl px-3 py-2 active:opacity-80 ${
                      active
                        ? 'bg-[#162C66]'
                        : disabled
                          ? 'border border-slate-100 bg-slate-50'
                          : 'border border-slate-200 bg-white'
                    }`}
                  >
                    <Text
                      className={`text-[12px] font-bold ${
                        active
                          ? 'text-white'
                          : disabled
                            ? 'text-slate-300'
                            : 'text-[#0B1F44]'
                      }`}
                    >
                      {skill}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          <View className="h-4" />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky bottom CTA */}
      <View
        className="absolute bottom-0 left-0 right-0 border-t border-slate-200/60 bg-white px-4 pt-3"
        style={{
          paddingBottom: 24,
          shadowColor: '#0B1F44',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Pressable
          onPress={onSubmit}
          disabled={submitting}
          className="h-[52px] flex-row items-center justify-center rounded-xl bg-[#162C66] active:opacity-90 disabled:opacity-60"
          style={{
            shadowColor: '#162C66',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 4,
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Save color="#FFFFFF" size={16} />
              <Text className="ml-2 text-[15px] font-extrabold text-white">
                {c.saveBtn}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

/* ─── UI helpers ─────────────────────────────────────────── */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="mx-4 mt-4 overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5"
      style={{
        shadowColor: '#0B1F44',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      {children}
    </View>
  );
}

function SectionHeader({
  icon,
  eyebrow: _eyebrow,
  title,
  subtitle,
  required,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  subtitle?: string;
  required?: boolean;
}) {
  return (
    <View>
      <View className="flex-row items-center" style={{ gap: 10 }}>
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#162C66]/[0.06]">
          {icon}
        </View>
        <View className="flex-1">
          <Text className="text-[16px] font-extrabold tracking-tight text-[#0B1F44]">
            {title}
            {required ? <Text className="text-red-500"> *</Text> : null}
          </Text>
          {subtitle ? (
            <Text className="mt-0.5 text-[12px] font-medium text-slate-500">
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function Field({
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
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words';
}) {
  return (
    <View>
      <Text className="mb-2 text-[12px] font-extrabold uppercase tracking-wider text-slate-500">
        {label} {required ? <Text className="text-red-500">*</Text> : null}
      </Text>
      <View
        className="h-[56px] flex-row items-center rounded-xl border border-slate-200 bg-slate-50/80"
        style={{ paddingHorizontal: 14 }}
      >
        <View className="h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-white">
          {icon}
        </View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          className="ml-3 flex-1 text-[15px] font-medium text-[#0B1F44]"
          style={{ height: '100%' }}
        />
      </View>
    </View>
  );
}
