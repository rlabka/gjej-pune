/**
 * Cross-language skill translation map.
 * Skills are stored in the DB in whatever language the user selected them.
 * This module translates them to the current viewing locale.
 */

type Locale = 'de' | 'en' | 'fr' | 'it' | 'sq';

// Each row = same skill in all 5 languages (index-aligned)
// Includes BOTH old noun-based skills (for legacy DB data) AND new adjective-based skills
const SKILL_MATRIX: Record<Locale, string[]> = {
  de: [
    // Legacy noun-based (indices 0-9)
    'Kommunikation','Geduld','Verantwortung','Professionalität','Stressmanagement','Mitgefühl & Empathie','Emotionale Intelligenz','Zeitmanagement','Problemlösung','Teamarbeit',
    // New adjective-based (indices 10-29)
    'Kommunikativ','Geduldig','Verantwortungsbewusst','Professionell','Stressresistent','Empathisch','Teamfähig','Zuverlässig','Flexibel','Motiviert','Organisiert','Kreativ','Belastbar','Lösungsorientiert','Selbstständig','Freundlich','Sorgfältig','Engagiert','Hilfsbereit','Lernbereit',
  ],
  en: [
    'Communication','Patience','Responsibility','Professionalism','Stress Management','Compassion & Empathy','Emotional Intelligence','Time Management','Problem Solving','Teamwork',
    'Communicative','Patient','Responsible','Professional','Stress-resistant','Empathetic','Team-oriented','Reliable','Flexible','Motivated','Organized','Creative','Resilient','Solution-oriented','Independent','Friendly','Thorough','Committed','Helpful','Eager to learn',
  ],
  fr: [
    'Communication','Patience','Responsabilité','Professionnalisme','Gestion du stress','Compassion & Empathie','Intelligence émotionnelle','Gestion du temps','Résolution de problèmes','Travail d\'équipe',
    'Communicatif','Patient','Responsable','Professionnel','Résistant au stress','Empathique','Esprit d\'équipe','Fiable','Flexible','Motivé','Organisé','Créatif','Endurant','Orienté solutions','Autonome','Aimable','Soigneux','Engagé','Serviable','Désireux d\'apprendre',
  ],
  it: [
    'Comunicazione','Pazienza','Responsabilità','Professionalità','Gestione dello stress','Compassione & Empatia','Intelligenza emotiva','Gestione del tempo','Problem solving','Lavoro di squadra',
    'Comunicativo','Paziente','Responsabile','Professionale','Resistente allo stress','Empatico','Spirito di squadra','Affidabile','Flessibile','Motivato','Organizzato','Creativo','Resistente','Orientato alle soluzioni','Autonomo','Amichevole','Accurato','Impegnato','Disponibile','Desideroso di imparare',
  ],
  sq: [
    'Komunikimi','Durimi','Përgjegjësia','Profesionalizmi','Menaxhimi i stresit','Dhembshuria & Empatia','Inteligjenca emocionale','Menaxhimi i kohës','Zgjidhja e problemeve','Puna në grup',
    'Komunikues','Durimtar','I përgjegjshëm','Profesional','Rezistent ndaj stresit','Empatik','Punues në grup','I besueshëm','Fleksibël','I motivuar','I organizuar','Kreativ','I qëndrueshëm','I orientuar nga zgjidhjet','I pavarur','Miqësor','I kujdesshëm','I angazhuar','Ndihmues','I gatshëm për të mësuar',
  ],
};

// Build a reverse lookup: any skill string → index
const skillToIndex = new Map<string, number>();
for (const lang of Object.keys(SKILL_MATRIX) as Locale[]) {
  SKILL_MATRIX[lang].forEach((skill, i) => {
    skillToIndex.set(skill.toLowerCase(), i);
  });
}

/**
 * Translate a single skill to the target locale.
 * Returns the original string if no translation is found.
 */
export function translateSkill(skill: string, targetLocale: string): string {
  const loc = (targetLocale as Locale) || 'de';
  const idx = skillToIndex.get(skill.toLowerCase());
  if (idx === undefined) return skill;
  return SKILL_MATRIX[loc]?.[idx] ?? skill;
}

/**
 * Translate an array of skills to the target locale.
 */
export function translateSkills(skills: string[], targetLocale: string): string[] {
  return skills.map((s) => translateSkill(s, targetLocale));
}

// ─── Experience translation ────────────────────────────────

const EXP_MATRIX: Record<Locale, string[]> = {
  de: ['< 1 Jahr','1 Jahr','2 Jahre','3 Jahre','4 Jahre','5 Jahre','5+ Jahre','10+ Jahre'],
  en: ['< 1 year','1 year','2 years','3 years','4 years','5 years','5+ years','10+ years'],
  fr: ['< 1 an','1 an','2 ans','3 ans','4 ans','5 ans','5+ ans','10+ ans'],
  it: ['< 1 anno','1 anno','2 anni','3 anni','4 anni','5 anni','5+ anni','10+ anni'],
  sq: ['< 1 vit','1 vit','2 vite','3 vite','4 vite','5 vite','5+ vite','10+ vite'],
};

const expToIndex = new Map<string, number>();
for (const lang of Object.keys(EXP_MATRIX) as Locale[]) {
  EXP_MATRIX[lang].forEach((exp, i) => {
    expToIndex.set(exp.toLowerCase(), i);
  });
}

/**
 * Translate an experience label to the target locale.
 */
export function translateExperience(exp: string, targetLocale: string): string {
  const loc = (targetLocale as Locale) || 'de';
  const idx = expToIndex.get(exp.toLowerCase());
  if (idx === undefined) return exp;
  return EXP_MATRIX[loc]?.[idx] ?? exp;
}
