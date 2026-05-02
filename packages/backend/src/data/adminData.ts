/**
 * Admin panel data layer.
 * Mock data structured for real SaaS admin logic. Replace with API calls when backend is ready.
 */

export type AdminMetrics = {
  totalJobSeekers: number;
  totalEmployers: number;
  activeJobs: number;
  pendingApprovals: number;
};

export type RecentRegistration = {
  id: string;
  email: string;
  role: 'job-seeker' | 'employer';
  displayName: string | null;
  createdAt: string; // ISO
};

export type EmployerPendingReview = {
  id: string;
  companyName: string;
  email: string;
  submittedAt: string; // ISO
  status: 'pending' | 'under_review';
};

export type JobPendingModeration = {
  id: string;
  title: string;
  companyName: string;
  status: 'pending' | 'flagged';
  submittedAt: string; // ISO
};

/** Dashboard overview. In production: GET /api/admin/dashboard */
export function getAdminDashboardMetrics(): AdminMetrics {
  return {
    totalJobSeekers: 1247,
    totalEmployers: 89,
    activeJobs: 312,
    pendingApprovals: 23
  };
}

/** Recent user registrations. In production: GET /api/admin/registrations?limit=10 */
export function getRecentRegistrations(limit = 10): RecentRegistration[] {
  const registrations: RecentRegistration[] = [
    { id: '1', email: 'sarah.k@example.com', role: 'job-seeker', displayName: 'Sarah K.', createdAt: '2025-02-01T09:15:00Z' },
    { id: '2', email: 'tech.hr@startup.ch', role: 'employer', displayName: null, createdAt: '2025-02-01T08:42:00Z' },
    { id: '3', email: 'marc.berner@example.com', role: 'job-seeker', displayName: 'Marc Berner', createdAt: '2025-02-01T07:30:00Z' },
    { id: '4', email: 'jobs@company-ag.ch', role: 'employer', displayName: null, createdAt: '2025-01-31T18:20:00Z' },
    { id: '5', email: 'lisa.mueller@example.com', role: 'job-seeker', displayName: 'Lisa Müller', createdAt: '2025-01-31T16:05:00Z' },
    { id: '6', email: 'hr@innovate.io', role: 'employer', displayName: null, createdAt: '2025-01-31T14:00:00Z' },
    { id: '7', email: 'pierre.dubois@example.com', role: 'job-seeker', displayName: 'Pierre Dubois', createdAt: '2025-01-31T11:22:00Z' },
    { id: '8', email: 'recruitment@bigcorp.ch', role: 'employer', displayName: null, createdAt: '2025-01-30T17:45:00Z' }
  ];
  return registrations.slice(0, limit);
}

/** Employers awaiting admin review. In production: GET /api/admin/employers?status=pending */
export function getEmployersPendingReview(limit = 8): EmployerPendingReview[] {
  const employers: EmployerPendingReview[] = [
    { id: 'e1', companyName: 'TechStart AG', email: 'hr@techstart.ch', submittedAt: '2025-02-01T08:00:00Z', status: 'pending' },
    { id: 'e2', companyName: 'Innovate Solutions GmbH', email: 'jobs@innovate.de', submittedAt: '2025-01-31T14:30:00Z', status: 'pending' },
    { id: 'e3', companyName: 'Swiss Digital Labs', email: 'careers@swissdigital.ch', submittedAt: '2025-01-31T11:00:00Z', status: 'under_review' },
    { id: 'e4', companyName: 'Green Energy Co', email: 'recruit@greenenergy.ch', submittedAt: '2025-01-30T16:20:00Z', status: 'pending' },
    { id: 'e5', companyName: 'FinanceHub SA', email: 'talent@financehub.ch', submittedAt: '2025-01-30T09:15:00Z', status: 'pending' }
  ];
  return employers.slice(0, limit);
}

/** Jobs awaiting moderation. In production: GET /api/admin/jobs?status=pending */
export function getJobsPendingModeration(limit = 8): JobPendingModeration[] {
  const jobs: JobPendingModeration[] = [
    { id: 'j1', title: 'Senior Frontend Engineer', companyName: 'TechStart AG', status: 'pending', submittedAt: '2025-02-01T10:00:00Z' },
    { id: 'j2', title: 'Product Manager', companyName: 'Innovate Solutions GmbH', status: 'pending', submittedAt: '2025-01-31T15:00:00Z' },
    { id: 'j3', title: 'UX Designer', companyName: 'Swiss Digital Labs', status: 'flagged', submittedAt: '2025-01-31T12:00:00Z' },
    { id: 'j4', title: 'DevOps Engineer', companyName: 'Green Energy Co', status: 'pending', submittedAt: '2025-01-30T17:00:00Z' },
    { id: 'j5', title: 'Data Analyst', companyName: 'FinanceHub SA', status: 'pending', submittedAt: '2025-01-30T10:30:00Z' },
    { id: 'j6', title: 'Marketing Lead', companyName: 'TechStart AG', status: 'pending', submittedAt: '2025-01-29T14:00:00Z' }
  ];
  return jobs.slice(0, limit);
}
