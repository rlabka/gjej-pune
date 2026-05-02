import type { ReactNode } from 'react';
import AuthShell from './AuthShell';

export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}

