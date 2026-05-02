/**
 * Dashboard KPIs and lists derived from admin mock data.
 * Used by /admin/dashboard. Replace with API when backend is ready.
 */

import { getJobSeekers, type JobSeeker } from './mockAdminJobSeekers';
import { getEmployers, type EmployerWithCompany } from './mockAdminEmployers';
import { getCompanies, type Company } from './mockAdminCompanies';

export type DashboardKpis = {
  totalJobSeekers: number;
  totalEmployers: number;
  totalCompanies: number;
  activeJobs: number;
  suspendedAccounts: number;
  pendingVerifications: number;
};

export function getDashboardKpis(): DashboardKpis {
  const jobSeekers = getJobSeekers();
  const employers = getEmployers();
  const companies = getCompanies();

  const suspendedJobSeekers = jobSeekers.filter((s) => s.status === 'suspended' || s.status === 'banned').length;
  const suspendedEmployers = employers.filter((e) => e.status === 'suspended' || e.status === 'banned').length;
  const activeJobs = companies.reduce((sum, c) => sum + (c.jobsCount ?? 0), 0);
  const pendingVerifications = companies.filter((c) => !c.verified).length;

  return {
    totalJobSeekers: jobSeekers.length,
    totalEmployers: employers.length,
    totalCompanies: companies.length,
    activeJobs,
    suspendedAccounts: suspendedJobSeekers + suspendedEmployers,
    pendingVerifications,
  };
}

const byCreatedAtDesc = <T extends { createdAt: string }>(a: T, b: T) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

export function getRecentJobSeekers(limit = 5): JobSeeker[] {
  return getJobSeekers().sort(byCreatedAtDesc).slice(0, limit);
}

export function getRecentEmployers(limit = 5): EmployerWithCompany[] {
  return getEmployers().sort(byCreatedAtDesc).slice(0, limit);
}

export function getRecentCompanies(limit = 5): Company[] {
  return getCompanies().sort(byCreatedAtDesc).slice(0, limit);
}

export function getSuspendedJobSeekers(): JobSeeker[] {
  return getJobSeekers().filter((s) => s.status === 'suspended' || s.status === 'banned');
}

export function getSuspendedEmployers(): EmployerWithCompany[] {
  return getEmployers().filter((e) => e.status === 'suspended' || e.status === 'banned');
}

export function getUnverifiedCompanies(): Company[] {
  return getCompanies().filter((c) => !c.verified);
}
