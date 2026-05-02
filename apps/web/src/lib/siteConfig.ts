/**
 * Site-wide config controlled by admin panel.
 * Stored in localStorage; read by app components and admin UI.
 */

const THEME_KEY = 'admin.theme';
const JOB_SEEKER_KEY = 'admin.jobSeeker';
const EMPLOYER_KEY = 'admin.employer';
const CONFIG_UPDATED_EVENT = 'site-config-updated';

export type ThemeConfig = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  neutralBg: string;
  headingFont: string;
  bodyFont: string;
  logoUrl: string;
  faviconUrl: string;
  heroImageUrl: string;
  /** Site name shown in header/footer and as logo alt text */
  siteName: string;
  /** Tagline or short description for branding */
  tagline: string;
  borderRadius: string;
};

export type JobSeekerDashboardConfig = {
  recommendedJobs: boolean;
  recentApplications: boolean;
  profileCompletion: boolean;
  metrics: boolean;
};

export type JobSeekerJobsPageConfig = {
  showFilters: boolean;
  resultsPerPage: number;
  defaultSort: 'relevance' | 'date';
};

/** Access & moderation: registration, login, ban list, delete account */
export type JobSeekerAccessConfig = {
  allowRegistration: boolean;
  allowLogin: boolean;
  bannedEmails: string[];
  allowDeleteOwnAccount: boolean;
};

/** Feature visibility: show/hide sections and actions for job seekers */
export type JobSeekerFeaturesConfig = {
  showMessages: boolean;
  showSavedJobs: boolean;
  showApplications: boolean;
  showProfile: boolean;
  allowApplyToJobs: boolean;
  allowSaveJobs: boolean;
};

export type JobSeekerConfig = {
  access: JobSeekerAccessConfig;
  features: JobSeekerFeaturesConfig;
  dashboard: JobSeekerDashboardConfig;
  jobsPage: JobSeekerJobsPageConfig;
};

export type EmployerDashboardConfig = {
  overviewMetrics: boolean;
  recentCandidates: boolean;
  jobList: boolean;
};

export type EmployerConfig = {
  dashboard: EmployerDashboardConfig;
  applicationsPipeline: boolean;
  companyPage: boolean;
  messages: boolean;
};

const DEFAULT_THEME: ThemeConfig = {
  primary: '#F5C400',
  secondary: '#162C66',
  accent: '#F5C400',
  background: '#FFFFFF',
  foreground: '#333333',
  neutralBg: '#F7F7F7',
  headingFont: 'var(--font-plus-jakarta), var(--font-inter), system-ui, sans-serif',
  bodyFont: 'var(--font-inter), system-ui, sans-serif',
  logoUrl: '/logo.png',
  faviconUrl: '', // use app/icon.tsx (brand favicon) when empty
  heroImageUrl: '',
  siteName: 'gjej-pune.com',
  tagline: '',
  borderRadius: '0.75rem'
};

const DEFAULT_JOB_SEEKER: JobSeekerConfig = {
  access: {
    allowRegistration: true,
    allowLogin: true,
    bannedEmails: [],
    allowDeleteOwnAccount: true
  },
  features: {
    showMessages: true,
    showSavedJobs: true,
    showApplications: false,
    showProfile: true,
    allowApplyToJobs: true,
    allowSaveJobs: true
  },
  dashboard: {
    recommendedJobs: true,
    recentApplications: false,
    profileCompletion: true,
    metrics: true
  },
  jobsPage: {
    showFilters: true,
    resultsPerPage: 10,
    defaultSort: 'relevance'
  }
};

const DEFAULT_EMPLOYER: EmployerConfig = {
  dashboard: {
    overviewMetrics: true,
    recentCandidates: true,
    jobList: true
  },
  applicationsPipeline: true,
  companyPage: true,
  messages: true
};

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function safeParse<T>(key: string, defaultValue: T): T {
  if (!canUseStorage()) return defaultValue;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultValue;
    return { ...defaultValue, ...JSON.parse(raw) } as T;
  } catch {
    return defaultValue;
  }
}

function dispatchConfigUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CONFIG_UPDATED_EVENT));
  }
}

export function getThemeConfig(): ThemeConfig {
  return safeParse(THEME_KEY, DEFAULT_THEME);
}

export function setThemeConfig(config: Partial<ThemeConfig>) {
  if (!canUseStorage()) return;
  const current = getThemeConfig();
  const next = { ...current, ...config };
  window.localStorage.setItem(THEME_KEY, JSON.stringify(next));
  dispatchConfigUpdated();
}

export function resetThemeConfig() {
  if (canUseStorage()) window.localStorage.removeItem(THEME_KEY);
  dispatchConfigUpdated();
}

export function getJobSeekerConfig(): JobSeekerConfig {
  return safeParse(JOB_SEEKER_KEY, DEFAULT_JOB_SEEKER);
}

export function setJobSeekerConfig(config: Partial<JobSeekerConfig>) {
  if (!canUseStorage()) return;
  const current = getJobSeekerConfig();
  const next = { ...current, ...config };
  window.localStorage.setItem(JOB_SEEKER_KEY, JSON.stringify(next));
  dispatchConfigUpdated();
}

export function resetJobSeekerConfig() {
  if (canUseStorage()) window.localStorage.removeItem(JOB_SEEKER_KEY);
  dispatchConfigUpdated();
}

export function getEmployerConfig(): EmployerConfig {
  return safeParse(EMPLOYER_KEY, DEFAULT_EMPLOYER);
}

export function setEmployerConfig(config: Partial<EmployerConfig>) {
  if (!canUseStorage()) return;
  const current = getEmployerConfig();
  const next = { ...current, ...config };
  window.localStorage.setItem(EMPLOYER_KEY, JSON.stringify(next));
  dispatchConfigUpdated();
}

export function resetEmployerConfig() {
  if (canUseStorage()) window.localStorage.removeItem(EMPLOYER_KEY);
  dispatchConfigUpdated();
}

export { CONFIG_UPDATED_EVENT, DEFAULT_THEME, DEFAULT_JOB_SEEKER, DEFAULT_EMPLOYER };
