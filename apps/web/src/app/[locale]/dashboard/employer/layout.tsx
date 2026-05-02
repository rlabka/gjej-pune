export const dynamic = 'force-dynamic';
import type { ReactNode } from 'react';
import EmployerDashboardShell from './shell';

export default function EmployerDashboardLayout({ children }: { children: ReactNode }) {
  return <EmployerDashboardShell>{children}</EmployerDashboardShell>;
}
