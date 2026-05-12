import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Briefcase,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  FileEdit,
  Globe,
  ImagePlus,
  MapPin,
  Phone,
  Sparkles,
  User,
  X,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useDialog } from '@/contexts/DialogContext';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { JobCategoryPicker } from '@/components/JobCategoryPicker';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { PhoneInput } from '@/components/PhoneInput';
import type { LocationSuggestion } from '@/lib/useLocationAutocomplete';

type Locale = 'de' | 'en' | 'fr' | 'it' | 'sq';

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

const langNames: Record<Locale, Record<string, string>> = {
  de: { sq: 'Albanisch', de: 'Deutsch', en: 'Englisch', fr: 'Französisch', it: 'Italienisch', el: 'Griechisch', tr: 'Türkisch', sr: 'Serbisch', mk: 'Mazedonisch', es: 'Spanisch', pt: 'Portugiesisch', ro: 'Rumänisch', pl: 'Polnisch', nl: 'Niederländisch', ru: 'Russisch', ar: 'Arabisch' },
  en: { sq: 'Albanian', de: 'German', en: 'English', fr: 'French', it: 'Italian', el: 'Greek', tr: 'Turkish', sr: 'Serbian', mk: 'Macedonian', es: 'Spanish', pt: 'Portuguese', ro: 'Romanian', pl: 'Polish', nl: 'Dutch', ru: 'Russian', ar: 'Arabic' },
  fr: { sq: 'Albanais', de: 'Allemand', en: 'Anglais', fr: 'Français', it: 'Italien', el: 'Grec', tr: 'Turc', sr: 'Serbe', mk: 'Macédonien', es: 'Espagnol', pt: 'Portugais', ro: 'Roumain', pl: 'Polonais', nl: 'Néerlandais', ru: 'Russe', ar: 'Arabe' },
  it: { sq: 'Albanese', de: 'Tedesco', en: 'Inglese', fr: 'Francese', it: 'Italiano', el: 'Greco', tr: 'Turco', sr: 'Serbo', mk: 'Macedone', es: 'Spagnolo', pt: 'Portoghese', ro: 'Rumeno', pl: 'Polacco', nl: 'Olandese', ru: 'Russo', ar: 'Arabo' },
  sq: { sq: 'Shqip', de: 'Gjermanisht', en: 'Anglisht', fr: 'Frëngjisht', it: 'Italisht', el: 'Greqisht', tr: 'Turqisht', sr: 'Serbisht', mk: 'Maqedonisht', es: 'Spanjisht', pt: 'Portugalisht', ro: 'Rumanisht', pl: 'Polonisht', nl: 'Holandisht', ru: 'Rusisht', ar: 'Arabisht' },
};

type CopyShape = {
  createProfile: string;
  whatJob: string;
  selectCategory: string;
  yourInfo: string;
  name: string;
  surname: string;
  hidden: string;
  telNr: string;
  age: string;
  agePlaceholder: string;
  photo: string;
  uploadPhoto: string;
  changePhoto: string;
  photoHint: string;
  photoFormats: string;
  photoGuideTitle: string;
  photoRules: string[];
  experience: string;
  selectExperience: string;
  experienceOpts: string[];
  livingPlace: string;
  livingPlacePh: string;
  languages: string;
  languagesHint: string;
  skills: string;
  skillsHint: string;
  selected: string;
  checklist: string;
  jobCategory: string;
  languagesMin: string;
  skillsMax: string;
  publishTitle: string;
  publishDesc: string;
  publishBtn: string;
  publishing: string;
  successToast: string;
  predefinedSkills: string[];
};

const COPY: Record<Locale, CopyShape> = {
  de: {
    createProfile: 'Neues Jobprofil erstellen',
    whatJob: 'Welche Art von Job suchst du?',
    selectCategory: 'Jobkategorie auswählen...',
    yourInfo: 'Deine Informationen',
    name: 'Name', surname: 'Nachname', hidden: '(versteckt)', telNr: 'Tel. Nr.',
    age: 'Alter', agePlaceholder: 'Dein Alter',
    photo: 'Foto', uploadPhoto: 'Foto hochladen', changePhoto: 'Foto ändern',
    photoHint: 'Profile mit Foto erhalten oft mehr Nachrichten als solche ohne Foto.',
    photoFormats: 'Als PNG, JPG, GIF hochladen, minimal 640 x 640 oder jetzt Selfie machen.',
    photoGuideTitle: 'So klappt es mit Ihrem Bild',
    photoRules: [
      'Gut erkennbares Profilbild von Ihnen',
      'Positive Ausstrahlung & geeignete Kleidung',
      'Keine Kinder und zusätzliche Personen im Bild',
      'Keine Logos, Graphiken und Illustrationen',
      'Keine Telefonnummern und andere Kontaktdaten',
      'Gute Bildqualität',
    ],
    experience: 'Berufserfahrung', selectExperience: 'Auswählen...',
    experienceOpts: ['< 1 Jahr', '1 Jahr', '2 Jahre', '3 Jahre', '4 Jahre', '5 Jahre', '5+ Jahre', '10+ Jahre'],
    livingPlace: 'Wohnort', livingPlacePh: 'Stadt oder Region',
    languages: 'Sprachkenntnisse', languagesHint: 'Welche Sprachen sprichst du? Wähle mindestens eine.',
    skills: 'Ich bin...', skillsHint: 'Wähle genau 3 Eigenschaften, die dich am besten beschreiben.',
    selected: 'ausgewählt',
    checklist: 'Profil-Checkliste', jobCategory: 'Jobkategorie', languagesMin: 'Sprache (min. 1)', skillsMax: 'Eigenschaften (3)',
    publishTitle: 'Profil veröffentlichen',
    publishDesc: 'Dein Profil wird für Arbeitgeber sichtbar, die nach Kandidaten suchen.',
    publishBtn: 'Profil veröffentlichen',
    publishing: 'Veröffentlichen...',
    successToast: 'Profil erfolgreich veröffentlicht!',
    predefinedSkills: ['Kommunikativ', 'Geduldig', 'Verantwortungsbewusst', 'Professionell', 'Stressresistent', 'Empathisch', 'Teamfähig', 'Zuverlässig', 'Flexibel', 'Motiviert', 'Organisiert', 'Kreativ', 'Belastbar', 'Lösungsorientiert', 'Selbstständig', 'Freundlich', 'Sorgfältig', 'Engagiert', 'Hilfsbereit', 'Lernbereit'],
  },
  en: {
    createProfile: 'Create new Job Profile',
    whatJob: 'What kind of Job are you looking for?',
    selectCategory: 'Select a job category...',
    yourInfo: 'Your Information',
    name: 'Name', surname: 'Surname', hidden: '(hidden)', telNr: 'Tel. Nr.',
    age: 'Age', agePlaceholder: 'Your age',
    photo: 'Photo', uploadPhoto: 'Upload photo', changePhoto: 'Change photo',
    photoHint: 'Profiles with a photo receive significantly more messages than those without.',
    photoFormats: 'Upload PNG, JPG, GIF, minimum 640 x 640 or take a selfie now.',
    photoGuideTitle: 'How to get your photo right',
    photoRules: [
      'Clearly recognizable profile picture of you',
      'Positive appearance & appropriate clothing',
      'No children or additional people in the picture',
      'No logos, graphics, or illustrations',
      'No phone numbers or other contact details',
      'Good image quality',
    ],
    experience: 'Work experience', selectExperience: 'Select...',
    experienceOpts: ['< 1 year', '1 year', '2 years', '3 years', '4 years', '5 years', '5+ years', '10+ years'],
    livingPlace: 'Place of residence', livingPlacePh: 'City or region',
    languages: 'Language skills', languagesHint: 'Which languages do you speak? Select at least one.',
    skills: "I'm...", skillsHint: 'Select exactly 3 traits that best describe you.',
    selected: 'selected',
    checklist: 'Profile checklist', jobCategory: 'Job category', languagesMin: 'Language (min. 1)', skillsMax: 'Traits (3)',
    publishTitle: 'Publish profile',
    publishDesc: 'Your profile will be visible to employers searching for candidates.',
    publishBtn: 'Publish profile',
    publishing: 'Publishing...',
    successToast: 'Profile published successfully!',
    predefinedSkills: ['Communicative', 'Patient', 'Responsible', 'Professional', 'Stress-resistant', 'Empathetic', 'Team-oriented', 'Reliable', 'Flexible', 'Motivated', 'Organized', 'Creative', 'Resilient', 'Solution-oriented', 'Independent', 'Friendly', 'Thorough', 'Committed', 'Helpful', 'Eager to learn'],
  },
  fr: {
    createProfile: 'Créer un nouveau profil emploi',
    whatJob: "Quel type d'emploi recherchez-vous ?",
    selectCategory: 'Sélectionnez une catégorie...',
    yourInfo: 'Vos informations',
    name: 'Prénom', surname: 'Nom', hidden: '(caché)', telNr: 'N° tél.',
    age: 'Âge', agePlaceholder: 'Votre âge',
    photo: 'Photo', uploadPhoto: 'Télécharger photo', changePhoto: 'Changer photo',
    photoHint: 'Les profils avec photo reçoivent beaucoup plus de messages que ceux sans photo.',
    photoFormats: 'Téléchargez PNG, JPG, GIF, minimum 640 x 640 ou prenez un selfie maintenant.',
    photoGuideTitle: "Comment réussir votre photo",
    photoRules: [
      'Photo de profil clairement reconnaissable',
      'Apparence positive & vêtements appropriés',
      "Pas d'enfants ou d'autres personnes sur la photo",
      'Pas de logos, graphiques ou illustrations',
      "Pas de numéros de téléphone ou autres coordonnées",
      'Bonne qualité d\'image',
    ],
    experience: "Expérience prof.", selectExperience: 'Sélectionner...',
    experienceOpts: ['< 1 an', '1 an', '2 ans', '3 ans', '4 ans', '5 ans', '5+ ans', '10+ ans'],
    livingPlace: 'Lieu de résidence', livingPlacePh: 'Ville ou région',
    languages: 'Compétences linguistiques', languagesHint: 'Quelles langues parlez-vous ? Sélectionnez au moins une.',
    skills: 'Je suis...', skillsHint: 'Sélectionnez exactement 3 traits qui vous décrivent le mieux.',
    selected: 'sélectionné(s)',
    checklist: 'Checklist de profil', jobCategory: "Catégorie d'emploi", languagesMin: 'Langue (min. 1)', skillsMax: 'Traits (3)',
    publishTitle: 'Publier le profil',
    publishDesc: "Votre profil sera visible par les employeurs recherchant des candidats.",
    publishBtn: 'Publier le profil',
    publishing: 'Publication...',
    successToast: 'Profil publié avec succès !',
    predefinedSkills: ['Communicatif', 'Patient', 'Responsable', 'Professionnel', 'Résistant au stress', 'Empathique', "Esprit d'équipe", 'Fiable', 'Flexible', 'Motivé', 'Organisé', 'Créatif', 'Endurant', 'Orienté solutions', 'Autonome', 'Aimable', 'Soigneux', 'Engagé', 'Serviable', "Désireux d'apprendre"],
  },
  it: {
    createProfile: 'Crea nuovo profilo lavoro',
    whatJob: 'Che tipo di lavoro stai cercando?',
    selectCategory: 'Seleziona una categoria...',
    yourInfo: 'Le tue informazioni',
    name: 'Nome', surname: 'Cognome', hidden: '(nascosto)', telNr: 'N° tel.',
    age: 'Età', agePlaceholder: 'La tua età',
    photo: 'Foto', uploadPhoto: 'Carica foto', changePhoto: 'Cambia foto',
    photoHint: 'I profili con foto ricevono molti più messaggi di quelli senza foto.',
    photoFormats: 'Carica PNG, JPG, GIF, minimo 640 x 640 o scatta un selfie ora.',
    photoGuideTitle: 'Come ottenere la foto giusta',
    photoRules: [
      'Foto profilo chiaramente riconoscibile',
      'Aspetto positivo & abbigliamento appropriato',
      'Nessun bambino o altra persona nella foto',
      'Niente loghi, grafici o illustrazioni',
      'Niente numeri di telefono o altri contatti',
      "Buona qualità dell'immagine",
    ],
    experience: 'Esperienza prof.', selectExperience: 'Seleziona...',
    experienceOpts: ['< 1 anno', '1 anno', '2 anni', '3 anni', '4 anni', '5 anni', '5+ anni', '10+ anni'],
    livingPlace: 'Luogo di residenza', livingPlacePh: 'Città o regione',
    languages: 'Conoscenze linguistiche', languagesHint: 'Quali lingue parli? Seleziona almeno una.',
    skills: 'Io sono...', skillsHint: 'Seleziona esattamente 3 caratteristiche che ti descrivono meglio.',
    selected: 'selezionate',
    checklist: 'Checklist profilo', jobCategory: 'Categoria lavoro', languagesMin: 'Lingua (min. 1)', skillsMax: 'Caratteristiche (3)',
    publishTitle: 'Pubblica profilo',
    publishDesc: 'Il tuo profilo sarà visibile ai datori di lavoro che cercano candidati.',
    publishBtn: 'Pubblica profilo',
    publishing: 'Pubblicazione...',
    successToast: 'Profilo pubblicato con successo!',
    predefinedSkills: ['Comunicativo', 'Paziente', 'Responsabile', 'Professionale', 'Resistente allo stress', 'Empatico', 'Team-oriented', 'Affidabile', 'Flessibile', 'Motivato', 'Organizzato', 'Creativo', 'Resiliente', 'Orientato alle soluzioni', 'Indipendente', 'Amichevole', 'Accurato', 'Impegnato', 'Disponibile', "Desideroso di imparare"],
  },
  sq: {
    createProfile: 'Krijo profil të ri pune',
    whatJob: 'Çfarë lloj pune po kërkon?',
    selectCategory: 'Zgjidh kategorinë...',
    yourInfo: 'Të dhënat e tua',
    name: 'Emri', surname: 'Mbiemri', hidden: '(i fshehur)', telNr: 'Nr. tel.',
    age: 'Mosha', agePlaceholder: 'Mosha jote',
    photo: 'Foto', uploadPhoto: 'Ngarko foto', changePhoto: 'Ndrysho foto',
    photoHint: 'Profilet me foto marrin shumë më tepër mesazhe se ato pa foto.',
    photoFormats: 'Ngarko PNG, JPG, GIF, minimum 640 x 640 ose bëj selfie tani.',
    photoGuideTitle: 'Si të bësh foton e duhur',
    photoRules: [
      'Foto profili e qartë e juaja',
      'Pamje pozitive & veshje e përshtatshme',
      'Pa fëmijë ose persona të tjerë në foto',
      'Pa logo, grafika ose ilustrime',
      'Pa numra telefoni ose të dhëna kontakti',
      'Cilësi e mirë e fotos',
    ],
    experience: 'Përvoja e punës', selectExperience: 'Zgjidh...',
    experienceOpts: ['< 1 vit', '1 vit', '2 vjet', '3 vjet', '4 vjet', '5 vjet', '5+ vjet', '10+ vjet'],
    livingPlace: 'Vendbanimi', livingPlacePh: 'Qyteti ose rajoni',
    languages: 'Aftësitë gjuhësore', languagesHint: 'Cilat gjuhë flet? Zgjidh të paktën një.',
    skills: 'Unë jam...', skillsHint: 'Zgjidh saktësisht 3 cilësi që të përshkruajnë më mirë.',
    selected: 'të zgjedhura',
    checklist: 'Lista e profilit', jobCategory: 'Kategoria e punës', languagesMin: 'Gjuha (min. 1)', skillsMax: 'Cilësitë (3)',
    publishTitle: 'Publiko profilin',
    publishDesc: 'Profili yt do të jetë i dukshëm për punëdhënësit që kërkojnë kandidatë.',
    publishBtn: 'Publiko profilin',
    publishing: 'Po publikohet...',
    successToast: 'Profili u publikua me sukses!',
    predefinedSkills: ['Komunikues', 'I durueshëm', 'I përgjegjshëm', 'Profesional', 'Rezistent ndaj stresit', 'Empatik', 'I orientuar drejt ekipit', 'I besueshëm', 'Fleksibël', 'I motivuar', 'I organizuar', 'Kreativ', 'I qëndrueshëm', 'I orientuar drejt zgjidhjeve', 'I pavarur', 'Miqësor', 'I kujdesshëm', 'I përkushtuar', 'Ndihmues', 'I etur për të mësuar'],
  },
};

export default function NewAdScreen() {
  const router = useRouter();
  const { locale } = useI18n();
  const dialog = useDialog();
  const { session } = useAuth();
  const l: Locale = (['de', 'en', 'fr', 'it', 'sq'] as const).includes(locale as Locale)
    ? (locale as Locale)
    : 'sq';
  const c = COPY[l];

  // Pre-fill name from the session — required by App Store Review
  // Guideline 4 so users who signed in via Apple/Google aren't asked to
  // re-enter information already provided by the Authentication Services
  // framework. We split on the first whitespace; lone names go into firstName.
  const initialName = (() => {
    const trimmed = (session?.displayName || '').trim();
    if (!trimmed) return { first: '', last: '' };
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) return { first: parts[0], last: '' };
    return { first: parts[0], last: parts.slice(1).join(' ') };
  })();

  const [jobCategory, setJobCategory] = useState('');
  const [firstName, setFirstName] = useState(initialName.first);
  const [surname, setSurname] = useState(initialName.last);
  const [telNr, setTelNr] = useState('');
  const [ageField, setAgeField] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [livingPlace, setLivingPlace] = useState('');
  const [livingLat, setLivingLat] = useState<number | null>(null);
  const [livingLng, setLivingLng] = useState<number | null>(null);
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showExperience, setShowExperience] = useState(false);

  const clearError = (k: string) =>
    setErrors((prev) => {
      if (!(k in prev)) return prev;
      const { [k]: _, ...rest } = prev;
      return rest;
    });

  const canPublish =
    !!jobCategory &&
    firstName.trim().length > 0 &&
    surname.trim().length > 0 &&
    // Phone is OPTIONAL — App Store Review Guideline 5.1.1(v) prohibits
    // requiring personal contact info beyond what is strictly necessary.
    // livingPlace remains required because it drives the matching feed.
    !!ageField &&
    Number(ageField) >= 16 &&
    Number(ageField) <= 99 &&
    !!yearsExperience &&
    livingPlace.trim().length > 0 &&
    livingLat !== null &&
    !!photo &&
    selectedLanguages.length > 0 &&
    selectedSkills.length === 3;

  async function pickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0]);
      clearError('photo');
    }
  }

  function toggleSkill(skill: string) {
    setSelectedSkills((prev) => {
      if (prev.includes(skill)) return prev.filter((s) => s !== skill);
      if (prev.length >= 3) return prev;
      return [...prev, skill];
    });
    clearError('skills');
  }

  function toggleLanguage(code: string) {
    setSelectedLanguages((prev) =>
      prev.includes(code) ? prev.filter((s) => s !== code) : [...prev, code]
    );
    clearError('spokenLanguages');
  }

  async function onPublish() {
    if (submitting) return;
    const next: Record<string, string> = {};
    if (!jobCategory) next.category = 'required';
    if (!firstName.trim()) next.firstName = 'required';
    if (!surname.trim()) next.surname = 'required';
    // telNr (phone) is optional — see canPublish comment above.
    if (!ageField || Number(ageField) < 16 || Number(ageField) > 99) next.age = 'invalidAge';
    if (!yearsExperience) next.experience = 'required';
    if (!livingPlace.trim() || livingLat === null) next.livingPlace = 'required';
    if (!photo) next.photo = 'required';
    if (selectedLanguages.length === 0) next.spokenLanguages = 'required';
    if (selectedSkills.length !== 3) next.skills = 'required';
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setSubmitting(true);
    try {
      const token = (await getToken()) ?? undefined;
      const payload = {
        category: jobCategory,
        firstName: firstName.trim(),
        surname: surname.trim(),
        phone: telNr.trim(),
        age: Number(ageField),
        experience: yearsExperience,
        livingPlace: livingPlace.trim(),
        lat: livingLat ?? undefined,
        lng: livingLng ?? undefined,
        skills: selectedSkills,
        spokenLanguages: selectedLanguages,
      };
      const res = await api.post<{
        ok: boolean;
        error?: string;
        details?: { field: string; message: string }[];
        ad?: { id: string };
      }>('/api/ads', payload, token);

      if (!res.ok || !res.ad) {
        if (res.error === 'validationError' && res.details) {
          const se: Record<string, string> = {};
          for (const d of res.details) se[d.field] = d.message;
          setErrors(se);
        } else {
          dialog.showError(undefined, c.publishTitle);
        }
        return;
      }

      // Upload photo
      if (photo) {
        const form = new FormData();
        form.append('photo', {
          uri: photo.uri,
          name: photo.fileName ?? `photo-${Date.now()}.jpg`,
          type: photo.mimeType ?? 'image/jpeg',
        } as any);
        try {
          await api.upload(`/api/ads/${res.ad.id}/photo`, form, token);
        } catch {
          // photo upload failure is non-fatal — ad is already created
        }
      }

      dialog.showSuccess(c.successToast);
      router.replace('/(tabs)' as any);
    } catch {
      dialog.showError(undefined, c.publishTitle);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Back button */}
        <View className="flex-row items-center px-4 pb-1 pt-2">
          <Pressable
            onPress={() => router.back()}
            className="h-9 w-9 items-center justify-center rounded-xl active:opacity-70"
          >
            <ArrowLeft color="#0B1F44" size={22} />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 120 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View className="mb-5 flex-row items-start px-5">
              <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-[#162C66]/[0.06]">
                <FileEdit color="#162C66" size={22} />
              </View>
              <View className="flex-1 pt-0.5">
                <Text className="text-xl font-extrabold text-[#0B1F44]">
                  {c.createProfile}
                </Text>
              </View>
            </View>

            {/* 1. Job Category */}
            <Card>
              <CardHeader
                icon={<Briefcase color="#D97706" size={16} />}
                iconBg="#FFFBEB"
                title={c.whatJob}
                required
              />
              <JobCategoryPicker
                value={jobCategory}
                onChange={(key) => {
                  setJobCategory(key);
                  clearError('category');
                }}
                placeholder={c.selectCategory}
                hasError={!!errors.category}
              />
            </Card>

            {/* 2. Personal Info */}
            <Card>
              <CardHeader
                icon={<User color="#162C66" size={16} />}
                iconBg="rgba(22,44,102,0.06)"
                title={c.yourInfo}
              />
              <View style={{ gap: 14 }}>
                <Field
                  label={c.name}
                  icon={<User color="#94A3B8" size={11} />}
                  required
                  value={firstName}
                  onChangeText={(v) => {
                    setFirstName(v);
                    clearError('firstName');
                  }}
                  placeholder={c.name}
                  hasError={!!errors.firstName}
                />
                <Field
                  label={c.surname}
                  icon={<User color="#94A3B8" size={11} />}
                  required
                  hint={c.hidden}
                  value={surname}
                  onChangeText={(v) => {
                    setSurname(v);
                    clearError('surname');
                  }}
                  placeholder={c.surname}
                  hasError={!!errors.surname}
                />
                <View>
                  <View className="mb-1.5 flex-row items-center" style={{ gap: 4 }}>
                    <Phone color="#94A3B8" size={11} />
                    <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {c.telNr}
                      <Text className="text-red-500"> *</Text>
                    </Text>
                    <Text className="text-[10px] font-medium text-slate-400">{c.hidden}</Text>
                  </View>
                  <PhoneInput
                    value={telNr}
                    onChange={(v) => {
                      setTelNr(v);
                      clearError('contactPhone');
                    }}
                    hasError={!!errors.contactPhone}
                  />
                </View>
                <Field
                  label={c.age}
                  required
                  value={ageField}
                  onChangeText={(v) => {
                    if (v === '' || /^\d{0,2}$/.test(v)) {
                      setAgeField(v);
                      clearError('age');
                    }
                  }}
                  placeholder={c.agePlaceholder}
                  keyboardType="number-pad"
                  hasError={!!errors.age}
                />
              </View>
            </Card>

            {/* 3. Photo */}
            <Card>
              <CardHeader
                icon={<Camera color="#0EA5E9" size={16} />}
                iconBg="#F0F9FF"
                title={c.photo}
                required
              />
              <Pressable
                onPress={pickImage}
                className={`items-center justify-center rounded-2xl border-2 border-dashed py-6 ${
                  errors.photo
                    ? 'border-red-300 bg-red-50/40'
                    : 'border-slate-200 bg-slate-50/60'
                }`}
              >
                {photo ? (
                  <View className="items-center">
                    <Image
                      source={{ uri: photo.uri }}
                      style={{ width: 96, height: 96, borderRadius: 48 }}
                    />
                    <Text className="mt-2 text-[13px] font-semibold text-[#162C66]">
                      {c.changePhoto}
                    </Text>
                  </View>
                ) : (
                  <View className="items-center">
                    <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-[#F5C400]/30">
                      <ImagePlus color="#162C66" size={22} />
                    </View>
                    <Text className="text-[14px] font-bold text-[#162C66]">
                      {c.uploadPhoto}
                    </Text>
                  </View>
                )}
              </Pressable>
              <Text className="mt-3 text-[12px] text-slate-500" style={{ lineHeight: 17 }}>
                {c.photoHint}
              </Text>
              <Text className="mt-1 text-[11px] text-slate-400">
                {c.photoFormats}
              </Text>

              {/* Photo guidelines */}
              <View className="mt-4 rounded-2xl bg-slate-50/60 p-4">
                <Text className="mb-2.5 text-[13px] font-bold text-[#0B1F44]">
                  {c.photoGuideTitle}
                </Text>
                <View style={{ gap: 6 }}>
                  {c.photoRules.map((rule, idx) => (
                    <View key={idx} className="flex-row items-start">
                      <View className="mr-2 mt-0.5 h-4 w-4 items-center justify-center rounded-full bg-emerald-100">
                        <Check color="#059669" size={10} />
                      </View>
                      <Text className="flex-1 text-[12px] text-slate-600" style={{ lineHeight: 17 }}>
                        {rule}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </Card>

            {/* 4. Experience */}
            <Card>
              <CardHeader
                icon={<Briefcase color="#7C3AED" size={16} />}
                iconBg="#F5F3FF"
                title={c.experience}
                required
              />
              <Pressable
                onPress={() => setShowExperience(true)}
                className={`flex-row items-center rounded-xl border px-4 py-3 ${
                  errors.experience
                    ? 'border-red-300 bg-red-50/50'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <Text
                  className={`flex-1 text-[15px] font-medium ${
                    yearsExperience ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  {yearsExperience || c.selectExperience}
                </Text>
                <ChevronDown color="#94A3B8" size={18} />
              </Pressable>
            </Card>

            {/* 5. Living Place */}
            <Card>
              <CardHeader
                icon={<MapPin color="#2563EB" size={16} />}
                iconBg="#EFF6FF"
                title={c.livingPlace}
                required
              />
              <LocationAutocomplete
                value={livingPlace}
                onChangeText={(val) => {
                  setLivingPlace(val);
                  setLivingLat(null);
                  setLivingLng(null);
                  clearError('livingPlace');
                }}
                onSelect={(s: LocationSuggestion) => {
                  const stateOrCountry = s.state || s.country || '';
                  setLivingPlace(
                    stateOrCountry && s.city !== stateOrCountry
                      ? `${s.city}, ${stateOrCountry}`
                      : s.city
                  );
                  setLivingLat(s.lat);
                  setLivingLng(s.lng);
                  clearError('livingPlace');
                }}
                placeholder={c.livingPlacePh}
                variant="light"
              />
            </Card>

            {/* 6. Languages */}
            <Card>
              <View className="mb-2 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View
                    className="mr-2.5 h-8 w-8 items-center justify-center rounded-xl"
                    style={{ backgroundColor: '#F0F9FF' }}
                  >
                    <Globe color="#0284C7" size={16} />
                  </View>
                  <Text className="text-[14px] font-bold text-[#0B1F44]">
                    {c.languages}
                    <Text className="text-red-500"> *</Text>
                  </Text>
                </View>
                <View
                  className={`rounded-full px-2.5 py-1 ${
                    selectedLanguages.length > 0 ? 'bg-emerald-100' : 'bg-slate-100'
                  }`}
                >
                  <Text
                    className={`text-[11px] font-bold ${
                      selectedLanguages.length > 0 ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    {selectedLanguages.length} {c.selected}
                  </Text>
                </View>
              </View>
              <Text className="mb-3 text-[12px] text-slate-500" style={{ lineHeight: 17 }}>
                {c.languagesHint}
              </Text>

              {selectedLanguages.length > 0 ? (
                <View className="mb-3 flex-row flex-wrap" style={{ gap: 6 }}>
                  {selectedLanguages.map((code) => {
                    const lang = AVAILABLE_LANGUAGES.find((la) => la.code === code);
                    const name = langNames[l]?.[code] || code;
                    return (
                      <Pressable
                        key={code}
                        onPress={() => toggleLanguage(code)}
                        className="flex-row items-center rounded-lg border border-sky-100 bg-sky-50 py-1 pl-2 pr-1"
                        style={{ gap: 6 }}
                      >
                        <Text className="text-[12px]">{lang?.flag ?? '🌐'}</Text>
                        <Text className="text-[12px] font-semibold text-sky-700">{name}</Text>
                        <View className="ml-0.5 h-4 w-4 items-center justify-center rounded-full bg-sky-100">
                          <X color="#0284C7" size={10} />
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              <View className="flex-row flex-wrap" style={{ gap: 6 }}>
                {AVAILABLE_LANGUAGES.map(({ code, flag }) => {
                  const isSelected = selectedLanguages.includes(code);
                  const name = langNames[l]?.[code] || code;
                  return (
                    <Pressable
                      key={code}
                      onPress={() => toggleLanguage(code)}
                      className={`flex-row items-center rounded-xl border px-3 py-2 ${
                        isSelected
                          ? 'border-[#162C66] bg-[#162C66]'
                          : 'border-slate-200 bg-white'
                      }`}
                      style={{ gap: 6 }}
                    >
                      <Text className="text-[14px]">{flag}</Text>
                      <Text
                        className={`text-[13px] font-semibold ${
                          isSelected ? 'text-white' : 'text-slate-700'
                        }`}
                      >
                        {name}
                      </Text>
                      {isSelected ? <Check color="#FFFFFF" size={12} /> : null}
                    </Pressable>
                  );
                })}
              </View>
              {errors.spokenLanguages ? (
                <Text className="mt-2 text-[11px] font-medium text-red-500">
                  {c.languagesMin}
                </Text>
              ) : null}
            </Card>

            {/* 7. Skills */}
            <Card>
              <View className="mb-2 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View
                    className="mr-2.5 h-8 w-8 items-center justify-center rounded-xl"
                    style={{ backgroundColor: '#F5F3FF' }}
                  >
                    <Sparkles color="#7C3AED" size={16} />
                  </View>
                  <Text className="text-[14px] font-bold text-[#0B1F44]">
                    {c.skills}
                    <Text className="text-red-500"> *</Text>
                  </Text>
                </View>
                <View
                  className={`rounded-full px-2.5 py-1 ${
                    selectedSkills.length === 3 ? 'bg-emerald-100' : 'bg-slate-100'
                  }`}
                >
                  <Text
                    className={`text-[11px] font-bold ${
                      selectedSkills.length === 3 ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    {selectedSkills.length}/3 {c.selected}
                  </Text>
                </View>
              </View>
              <Text className="mb-3 text-[12px] text-slate-500" style={{ lineHeight: 17 }}>
                {c.skillsHint}
              </Text>

              {selectedSkills.length > 0 ? (
                <View className="mb-3 flex-row flex-wrap" style={{ gap: 6 }}>
                  {selectedSkills.map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => toggleSkill(s)}
                      className="flex-row items-center rounded-lg border border-violet-100 bg-violet-50 py-1 pl-2 pr-1"
                      style={{ gap: 6 }}
                    >
                      <Text className="text-[12px] font-semibold text-violet-700">{s}</Text>
                      <View className="ml-0.5 h-4 w-4 items-center justify-center rounded-full bg-violet-100">
                        <X color="#7C3AED" size={10} />
                      </View>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <View className="flex-row flex-wrap" style={{ gap: 6 }}>
                {c.predefinedSkills.map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  const isDisabled = !isSelected && selectedSkills.length >= 3;
                  return (
                    <Pressable
                      key={skill}
                      onPress={() => toggleSkill(skill)}
                      disabled={isDisabled}
                      className={`flex-row items-center rounded-xl border px-3 py-2 ${
                        isSelected
                          ? 'border-violet-600 bg-violet-600'
                          : isDisabled
                            ? 'border-slate-200 bg-slate-50'
                            : 'border-slate-200 bg-white'
                      }`}
                      style={{ gap: 6, opacity: isDisabled ? 0.5 : 1 }}
                    >
                      <Text
                        className={`text-[13px] font-semibold ${
                          isSelected ? 'text-white' : 'text-slate-700'
                        }`}
                      >
                        {skill}
                      </Text>
                      {isSelected ? <Check color="#FFFFFF" size={12} /> : null}
                    </Pressable>
                  );
                })}
              </View>
              {errors.skills ? (
                <Text className="mt-2 text-[11px] font-medium text-red-500">
                  {c.skillsMax}
                </Text>
              ) : null}
            </Card>

            {/* Checklist */}
            <Card>
              <Text className="mb-3 text-sm font-bold text-[#0B1F44]">{c.checklist}</Text>
              <View style={{ gap: 8 }}>
                <ChecklistRow label={c.jobCategory} done={!!jobCategory} />
                <ChecklistRow label={c.name} done={!!firstName.trim()} />
                <ChecklistRow label={c.surname} done={!!surname.trim()} />
                <ChecklistRow label={c.telNr} done={!!telNr.trim()} />
                <ChecklistRow
                  label={c.age}
                  done={!!ageField && Number(ageField) >= 16 && Number(ageField) <= 99}
                />
                <ChecklistRow label={c.photo} done={!!photo} />
                <ChecklistRow
                  label={c.livingPlace}
                  done={!!livingPlace.trim() && livingLat !== null}
                />
                <ChecklistRow label={c.experience} done={!!yearsExperience} />
                <ChecklistRow label={c.languagesMin} done={selectedLanguages.length > 0} />
                <ChecklistRow label={c.skillsMax} done={selectedSkills.length === 3} />
              </View>
            </Card>

            {/* Publish card */}
            <View
              className="mx-4 mt-2 overflow-hidden rounded-2xl bg-[#162C66] p-5"
              style={{
                shadowColor: '#162C66',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.2,
                shadowRadius: 16,
                elevation: 4,
              }}
            >
              <View className="mb-4 h-11 w-11 items-center justify-center rounded-xl bg-[#F5C400]">
                <FileEdit color="#162C66" size={20} />
              </View>
              <Text className="text-lg font-bold text-white">{c.publishTitle}</Text>
              <Text
                className="mt-1.5 text-[13px] text-white/60"
                style={{ lineHeight: 18 }}
              >
                {c.publishDesc}
              </Text>
              <Pressable
                onPress={onPublish}
                disabled={submitting || !canPublish}
                className="mt-5 h-11 items-center justify-center rounded-xl bg-[#F5C400] active:opacity-90"
                style={{ opacity: submitting || !canPublish ? 0.5 : 1 }}
              >
                {submitting ? (
                  <ActivityIndicator color="#162C66" />
                ) : (
                  <Text className="text-sm font-bold text-[#162C66]">{c.publishBtn}</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Experience picker modal */}
      <Modal
        visible={showExperience}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowExperience(false)}
      >
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
          <View className="flex-row items-center border-b border-slate-200 px-4 py-3">
            <Text className="flex-1 text-base font-bold text-[#0B1F44]">{c.experience}</Text>
            <Pressable
              onPress={() => setShowExperience(false)}
              className="h-9 w-9 items-center justify-center rounded-xl active:opacity-70"
            >
              <X color="#0B1F44" size={20} />
            </Pressable>
          </View>
          <ScrollView className="flex-1">
            {c.experienceOpts.map((opt) => {
              const isActive = yearsExperience === opt;
              return (
                <Pressable
                  key={opt}
                  onPress={() => {
                    setYearsExperience(opt);
                    setShowExperience(false);
                    clearError('experience');
                  }}
                  className={`flex-row items-center border-b border-slate-100 px-4 py-3.5 ${
                    isActive ? 'bg-[#162C66]/5' : ''
                  }`}
                >
                  <Text
                    className={`flex-1 text-[15px] font-semibold ${
                      isActive ? 'text-[#162C66]' : 'text-slate-700'
                    }`}
                  >
                    {opt}
                  </Text>
                  {isActive ? <Check color="#162C66" size={18} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

// ─── Local helpers ──────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="mx-4 mb-4 rounded-2xl border border-slate-200 bg-white p-5"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      {children}
    </View>
  );
}

function CardHeader({
  icon,
  iconBg,
  title,
  required,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  required?: boolean;
}) {
  return (
    <View className="mb-4 flex-row items-center">
      <View
        className="mr-2.5 h-8 w-8 items-center justify-center rounded-xl"
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </View>
      <Text className="text-[14px] font-bold text-[#0B1F44]">
        {title}
        {required ? <Text className="text-red-500"> *</Text> : null}
      </Text>
    </View>
  );
}

function Field({
  label,
  icon,
  required,
  hint,
  hasError,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
  hint?: string;
  hasError?: boolean;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad' | 'phone-pad' | 'email-address' | 'decimal-pad';
}) {
  return (
    <View>
      <View className="mb-1.5 flex-row items-center" style={{ gap: 4 }}>
        {icon}
        <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {label}
          {required ? <Text className="text-red-500"> *</Text> : null}
        </Text>
        {hint ? (
          <Text className="text-[10px] font-medium text-slate-400">{hint}</Text>
        ) : null}
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType}
        className={`rounded-xl border px-4 py-3 text-[15px] font-medium text-slate-900 ${
          hasError ? 'border-red-300 bg-red-50/50' : 'border-slate-200 bg-slate-50'
        }`}
      />
    </View>
  );
}

function ChecklistRow({ label, done }: { label: string; done: boolean }) {
  return (
    <View className="flex-row items-center">
      <View
        className={`mr-2.5 h-5 w-5 items-center justify-center rounded-md ${
          done ? 'bg-emerald-100' : 'bg-slate-100'
        }`}
      >
        {done ? (
          <CheckCircle2 color="#059669" size={12} />
        ) : (
          <Circle color="#CBD5E1" size={12} />
        )}
      </View>
      <Text
        className={`text-[13px] font-medium ${done ? 'text-slate-700' : 'text-slate-400'}`}
      >
        {label}
      </Text>
    </View>
  );
}
