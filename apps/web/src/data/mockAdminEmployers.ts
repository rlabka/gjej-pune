/**
 * Mock data layer for Admin Employers management.
 * In-memory store only. Replace with API calls when backend is ready.
 */

import { getCompany } from './mockAdminCompanies';

export type EmployerRole = 'owner' | 'recruiter';

export type EmployerStatus = 'active' | 'suspended' | 'banned';

export type Employer = {
  id: string;
  name: string;
  email: string;
  role: EmployerRole;
  companyId: string;
  status: EmployerStatus;
  createdAt: string;
  lastLogin: string | null;
  banReason?: string;
};

/** Employer with resolved company name for list UIs. */
export type EmployerWithCompany = Employer & { companyName: string };

let store: Employer[] = [
  { id: 'e1', name: 'Anna Weber', email: 'anna@techstart.ch', role: 'owner', companyId: 'c1', status: 'active', createdAt: '2024-11-01T10:00:00Z', lastLogin: '2025-02-01T09:00:00Z' },
  { id: 'e2', name: 'Michael Koch', email: 'm.koch@techstart.ch', role: 'recruiter', companyId: 'c1', status: 'active', createdAt: '2024-11-15T09:00:00Z', lastLogin: '2025-01-31T14:00:00Z' },
  { id: 'e3', name: 'Julia Becker', email: 'julia@innovate.de', role: 'owner', companyId: 'c2', status: 'active', createdAt: '2024-11-15T09:00:00Z', lastLogin: '2025-02-01T08:00:00Z' },
  { id: 'e4', name: 'Thomas Müller', email: 't.mueller@innovate.de', role: 'recruiter', companyId: 'c2', status: 'suspended', createdAt: '2024-12-01T11:00:00Z', lastLogin: '2025-01-20T10:00:00Z' },
  { id: 'e5', name: 'Sophie Martin', email: 'sophie@swissdigital.ch', role: 'owner', companyId: 'c3', status: 'active', createdAt: '2024-12-01T14:00:00Z', lastLogin: '2025-01-30T16:00:00Z' },
  { id: 'e6', name: 'David Green', email: 'david@greenenergy.ch', role: 'owner', companyId: 'c4', status: 'active', createdAt: '2024-12-10T11:00:00Z', lastLogin: null },
  { id: 'e7', name: 'Laura Green', email: 'laura@greenenergy.ch', role: 'recruiter', companyId: 'c4', status: 'active', createdAt: '2024-12-12T09:00:00Z', lastLogin: '2025-01-28T12:00:00Z' },
  { id: 'e8', name: 'Paul Finance', email: 'paul@financehub.ch', role: 'owner', companyId: 'c5', status: 'banned', createdAt: '2024-12-20T08:00:00Z', lastLogin: '2025-01-10T09:00:00Z', banReason: 'Fraudulent listings' },
  { id: 'e9', name: 'Marie Dupont', email: 'marie@healthplus.ch', role: 'owner', companyId: 'c6', status: 'active', createdAt: '2025-01-05T12:00:00Z', lastLogin: '2025-02-01T07:00:00Z' },
  { id: 'e10', name: 'Hans Retail', email: 'hans@retailpro.ch', role: 'owner', companyId: 'c7', status: 'active', createdAt: '2025-01-12T10:00:00Z', lastLogin: '2025-01-25T11:00:00Z' }
];

function cloneStore(): Employer[] {
  return store.map((e) => ({ ...e }));
}

function withCompanyName(e: Employer): EmployerWithCompany {
  const company = getCompany(e.companyId);
  return { ...e, companyName: company?.name ?? '—' };
}

/** Get all employers with company name resolved. */
export function getEmployers(): EmployerWithCompany[] {
  return cloneStore().map(withCompanyName);
}

/** Get employers for a specific company. */
export function getEmployersByCompany(companyId: string): EmployerWithCompany[] {
  return store.filter((e) => e.companyId === companyId).map(withCompanyName);
}

/** Update status (active | suspended). For ban, use banEmployer. */
export function updateEmployerStatus(id: string, status: 'active' | 'suspended'): void {
  const i = store.findIndex((e) => e.id === id);
  if (i === -1) return;
  store[i] = { ...store[i], status };
  if (status === 'active') delete (store[i] as Partial<Employer>).banReason;
}

/** Ban an employer with optional reason. */
export function banEmployer(id: string, reason?: string): void {
  const i = store.findIndex((e) => e.id === id);
  if (i === -1) return;
  store[i] = { ...store[i], status: 'banned', banReason: reason ?? undefined };
}

/** Permanently remove an employer. */
export function deleteEmployer(id: string): void {
  store = store.filter((e) => e.id !== id);
}
