export const dynamic = 'force-dynamic';
import type { ReactNode } from 'react';
import JobSeekerDashboardShell from './shell';

export default function JobSeekerDashboardLayout({ children }: { children: ReactNode }) {
  return <JobSeekerDashboardShell>{children}</JobSeekerDashboardShell>;
}

