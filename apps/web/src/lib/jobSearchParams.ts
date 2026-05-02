/**
 * Shared job search URL params for dashboard and public /jobs.
 * Keeps one consistent param structure for shareable, bookmarkable URLs.
 */

export type JobSearchParams = {
  keyword: string;
  location: string;
  jobType: string[]; // fullTime, partTime, contract, remote
  experience: string[]; // entry, intermediate, senior
  salaryMin: number | null; // CHF k
  salaryMax: number | null; // CHF k
  sort: 'relevance' | 'date';
  industry?: string;
  posted?: string; // 24h, 7d, 14d, 30d or empty for anytime
  workModel?: string[]; // hybrid, remote (partially remote, fully remote)
  page: number; // 1-based for pagination
};

const PARAM_KEYWORD = 'keyword';
const PARAM_LOCATION = 'location';
const PARAM_JOB_TYPE = 'jobType';
const PARAM_EXPERIENCE = 'experience';
const PARAM_SALARY_MIN = 'salaryMin';
const PARAM_SALARY_MAX = 'salaryMax';
const PARAM_SORT = 'sort';
const PARAM_INDUSTRY = 'industry';
const PARAM_POSTED = 'posted';
const PARAM_WORK_MODEL = 'workModel';
const PARAM_PAGE = 'page';

export const DEFAULT_JOB_SEARCH_PARAMS: JobSearchParams = {
  keyword: '',
  location: '',
  jobType: [],
  experience: [],
  salaryMin: null,
  salaryMax: null,
  sort: 'relevance',
  industry: undefined,
  posted: undefined,
  workModel: [],
  page: 1
};

export type SearchParamsLike = { get: (name: string) => string | null };

function getMany(searchParams: SearchParamsLike, key: string): string[] {
  const single = searchParams.get(key);
  if (!single) return [];
  return single.split(',').map((s) => s.trim()).filter(Boolean);
}

function getOne(searchParams: SearchParamsLike, key: string): string | null {
  const v = searchParams.get(key);
  return v === '' ? null : (v ?? null);
}

function parseNum(value: string | null): number | null {
  if (value === null || value === '') return null;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

/**
 * Parse URL search params into JobSearchParams.
 * Safe for use with useSearchParams() or server searchParams.
 */
export function parseJobSearchParams(searchParams: SearchParamsLike): JobSearchParams {
  const sortRaw = getOne(searchParams, PARAM_SORT);
  const sort = sortRaw === 'date' ? 'date' : 'relevance';
  const pageRaw = parseNum(getOne(searchParams, PARAM_PAGE));
  const page = pageRaw != null && pageRaw >= 1 ? pageRaw : 1;
  return {
    keyword: getOne(searchParams, PARAM_KEYWORD) ?? '',
    location: getOne(searchParams, PARAM_LOCATION) ?? '',
    jobType: getMany(searchParams, PARAM_JOB_TYPE),
    experience: getMany(searchParams, PARAM_EXPERIENCE),
    salaryMin: parseNum(getOne(searchParams, PARAM_SALARY_MIN)),
    salaryMax: parseNum(getOne(searchParams, PARAM_SALARY_MAX)),
    sort,
    industry: getOne(searchParams, PARAM_INDUSTRY) ?? undefined,
    posted: getOne(searchParams, PARAM_POSTED) ?? undefined,
    workModel: getMany(searchParams, PARAM_WORK_MODEL),
    page
  };
}

/**
 * Build query string (without leading ?) from JobSearchParams.
 * Omits empty/default values so URL stays clean.
 */
export function buildJobSearchQueryString(params: Partial<JobSearchParams>): string {
  const q = new URLSearchParams();
  if (params.keyword?.trim()) q.set(PARAM_KEYWORD, params.keyword.trim());
  if (params.location?.trim()) q.set(PARAM_LOCATION, params.location.trim());
  if (params.jobType?.length) q.set(PARAM_JOB_TYPE, params.jobType.join(','));
  if (params.experience?.length) q.set(PARAM_EXPERIENCE, params.experience.join(','));
  if (params.salaryMin != null && params.salaryMin > 0) q.set(PARAM_SALARY_MIN, String(params.salaryMin));
  if (params.salaryMax != null && params.salaryMax > 0) q.set(PARAM_SALARY_MAX, String(params.salaryMax));
  if (params.sort && params.sort !== 'relevance') q.set(PARAM_SORT, params.sort);
  if (params.industry?.trim()) q.set(PARAM_INDUSTRY, params.industry.trim());
  if (params.posted?.trim()) q.set(PARAM_POSTED, params.posted.trim());
  if (params.workModel?.length) q.set(PARAM_WORK_MODEL, params.workModel.join(','));
  if (params.page != null && params.page > 1) q.set(PARAM_PAGE, String(params.page));
  const s = q.toString();
  return s ? `?${s}` : '';
}

/**
 * Build full path for job search (e.g. /jobs?keyword=...).
 * Use with router.push(path) or <Link href={path}>.
 * Base path is /jobs (locale will be added by next-intl).
 */
export function buildJobsSearchPath(params: Partial<JobSearchParams>): string {
  return `/jobs${buildJobSearchQueryString(params)}`;
}
