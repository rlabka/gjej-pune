export type ValidationErrors = Record<string, string>;

export function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function isValidPhone(v: string): boolean {
  return /^\+?[\d\s\-()]{6,20}$/.test(v);
}

// ─── Job Form Validation ────────────────────────────────

export function validateJobForm(data: {
  category: string;
  contactName: string;
  contactSurname: string;
  contactPhone: string;
  contactEmail?: string;
  salary?: string;
  locationState: string;
  locationCity: string;
  when: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!data.category) errors.category = 'required';
  if (!data.contactName.trim()) errors.contactName = 'required';
  else if (data.contactName.trim().length > 100) errors.contactName = 'maxLength';
  if (!data.contactSurname.trim()) errors.contactSurname = 'required';
  else if (data.contactSurname.trim().length > 100) errors.contactSurname = 'maxLength';
  if (!data.contactPhone.trim()) errors.contactPhone = 'required';
  else if (!isValidPhone(data.contactPhone)) errors.contactPhone = 'invalidPhone';
  if (data.contactEmail && !isValidEmail(data.contactEmail)) errors.contactEmail = 'invalidEmail';
  if (!data.salary) errors.salary = 'required';
  else if (isNaN(Number(data.salary)) || Number(data.salary) < 5) errors.salary = 'invalidSalary';
  if (!data.locationState.trim()) errors.locationState = 'required';
  if (!data.locationCity.trim()) errors.locationCity = 'required';
  if (!data.when) errors.when = 'required';

  return errors;
}

// ─── Ad Form Validation ─────────────────────────────────

export function validateAdForm(data: {
  category: string;
  firstName: string;
  surname: string;
  phone: string;
  age?: string;
  livingPlace?: string;
  experience?: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!data.category) errors.category = 'required';
  if (!data.firstName.trim()) errors.firstName = 'required';
  else if (data.firstName.trim().length > 100) errors.firstName = 'maxLength';
  if (!data.surname.trim()) errors.surname = 'required';
  else if (data.surname.trim().length > 100) errors.surname = 'maxLength';
  if (!data.phone.trim()) errors.phone = 'required';
  else if (!isValidPhone(data.phone)) errors.phone = 'invalidPhone';
  if (!data.age?.trim()) errors.age = 'required';
  else if (isNaN(Number(data.age)) || Number(data.age) < 16 || Number(data.age) > 99) errors.age = 'invalidAge';
  if (!data.livingPlace?.trim()) errors.livingPlace = 'required';
  if (!data.experience?.trim()) errors.experience = 'required';

  return errors;
}

// ─── Error Messages (localized) ─────────────────────────

const ERROR_MESSAGES: Record<string, Record<string, string>> = {
  required: {
    de: 'Pflichtfeld',
    en: 'Required',
    fr: 'Obligatoire',
    it: 'Obbligatorio',
    sq: 'E detyrueshme',
  },
  invalidEmail: {
    de: 'Ungültige E-Mail',
    en: 'Invalid email',
    fr: 'Email invalide',
    it: 'Email non valida',
    sq: 'Email i pavlefshëm',
  },
  invalidPhone: {
    de: 'Ungültige Telefonnummer',
    en: 'Invalid phone number',
    fr: 'Numéro invalide',
    it: 'Numero non valido',
    sq: 'Numër i pavlefshëm',
  },
  invalidNumber: {
    de: 'Ungültige Zahl',
    en: 'Invalid number',
    fr: 'Nombre invalide',
    it: 'Numero non valido',
    sq: 'Numër i pavlefshëm',
  },
  maxLength: {
    de: 'Zu lang',
    en: 'Too long',
    fr: 'Trop long',
    it: 'Troppo lungo',
    sq: 'Shumë e gjatë',
  },
  invalidSalary: {
    de: 'Gehalt muss mindestens 5 sein',
    en: 'Salary must be at least 5',
    fr: 'Le salaire doit être au moins 5',
    it: 'Lo stipendio deve essere almeno 5',
    sq: 'Paga duhet të jetë së paku 5',
  },
  invalidAge: {
    de: 'Alter muss zwischen 16 und 99 liegen',
    en: 'Age must be between 16 and 99',
    fr: 'L\'âge doit être entre 16 et 99',
    it: 'L\'età deve essere tra 16 e 99',
    sq: 'Mosha duhet të jetë midis 16 dhe 99',
  },
  photoRequired: {
    de: 'Foto ist Pflicht',
    en: 'Photo is required',
    fr: 'Photo obligatoire',
    it: 'Foto obbligatoria',
    sq: 'Foto është e detyrueshme',
  },
  skillsRequired: {
    de: 'Bitte wähle genau 3 Eigenschaften',
    en: 'Please select exactly 3 traits',
    fr: 'Veuillez sélectionner exactement 3 qualités',
    it: 'Seleziona esattamente 3 qualità',
    sq: 'Zgjidhni saktësisht 3 cilësi',
  },
};

export function getErrorMessage(errorKey: string, locale: string): string {
  return ERROR_MESSAGES[errorKey]?.[locale] ?? ERROR_MESSAGES[errorKey]?.en ?? errorKey;
}
