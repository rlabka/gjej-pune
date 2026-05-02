// ─── Job Categories ─────────────────────────────────────
export {
  JOB_CATEGORIES,
  getAllJobTitles,
  getCategoryForTitle,
  getCategoryLabelForTitle,
  getCategoryLabels,
  getTitlesBySlug,
  getTranslatedTitle,
  getTranslatedCategoryLabel,
  type JobCategory,
  type JobTitle,
  type Locale,
} from './jobCategories';

// ─── Auth Types ─────────────────────────────────────────

export type AuthRole = 'job-seeker' | 'employer' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  role: AuthRole;
  isPremium: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role?: AuthRole;
  displayName?: string;
}

export interface AuthResponse {
  ok: boolean;
  token?: string;
  user?: AuthUser;
  error?: string;
}

export interface SessionResponse {
  authenticated: boolean;
  user?: AuthUser;
}
