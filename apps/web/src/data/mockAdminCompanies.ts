/**
 * Mock data layer for Admin Companies management.
 * In-memory store only. Replace with API calls when backend is ready.
 */

export type Company = {
  id: string;
  name: string;
  industry: string;
  location: string;
  verified: boolean;
  jobsCount: number;
  employersCount: number;
  createdAt: string; // ISO
  disabled?: boolean; // mock: disabled companies are hidden from some flows
};

let store: Company[] = [
  { id: 'c1', name: 'TechStart AG', industry: 'Technology', location: 'Zürich', verified: true, jobsCount: 12, employersCount: 3, createdAt: '2024-11-01T10:00:00Z' },
  { id: 'c2', name: 'Innovate Solutions GmbH', industry: 'Consulting', location: 'Berlin', verified: true, jobsCount: 8, employersCount: 2, createdAt: '2024-11-15T09:00:00Z' },
  { id: 'c3', name: 'Swiss Digital Labs', industry: 'Technology', location: 'Geneva', verified: false, jobsCount: 5, employersCount: 1, createdAt: '2024-12-01T14:00:00Z' },
  { id: 'c4', name: 'Green Energy Co', industry: 'Energy', location: 'Bern', verified: true, jobsCount: 4, employersCount: 2, createdAt: '2024-12-10T11:00:00Z' },
  { id: 'c5', name: 'FinanceHub SA', industry: 'Finance', location: 'Zürich', verified: false, jobsCount: 6, employersCount: 1, createdAt: '2024-12-20T08:00:00Z' },
  { id: 'c6', name: 'HealthPlus Clinic', industry: 'Healthcare', location: 'Lausanne', verified: true, jobsCount: 3, employersCount: 1, createdAt: '2025-01-05T12:00:00Z' },
  { id: 'c7', name: 'Retail Pro CH', industry: 'Retail', location: 'Basel', verified: false, jobsCount: 2, employersCount: 1, createdAt: '2025-01-12T10:00:00Z' }
];

function cloneStore(): Company[] {
  return store.map((c) => ({ ...c }));
}

/** Get all companies. Returns a copy. */
export function getCompanies(): Company[] {
  return cloneStore();
}

/** Get a single company by id. */
export function getCompany(id: string): Company | null {
  const c = store.find((x) => x.id === id);
  return c ? { ...c } : null;
}

/** Set verified flag. */
export function updateCompanyVerified(id: string, verified: boolean): void {
  const i = store.findIndex((c) => c.id === id);
  if (i === -1) return;
  store[i] = { ...store[i], verified };
}

/** Disable or enable company (mock effect). */
export function setCompanyDisabled(id: string, disabled: boolean): void {
  const i = store.findIndex((c) => c.id === id);
  if (i === -1) return;
  store[i] = { ...store[i], disabled };
}

/** Permanently remove a company. */
export function deleteCompany(id: string): void {
  store = store.filter((c) => c.id !== id);
}
