import type { ReactNode } from 'react';
import DashboardGuard from './DashboardGuard';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  // Important: this layout only adds auth guarding behavior.
  // It does NOT add UI wrappers to avoid impacting existing dashboards.
  return <DashboardGuard>{children}</DashboardGuard>;
}

