'use client';

import { useSearchParams } from 'next/navigation';
import AuthUnified from '../AuthUnified';

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role') as 'job-seeker' | 'employer' | null;
  const returnUrl = searchParams.get('returnUrl') || undefined;

  return (
    <AuthUnified
      initialMode="register"
      registrationRole={role || undefined}
      returnUrl={returnUrl}
    />
  );
}

