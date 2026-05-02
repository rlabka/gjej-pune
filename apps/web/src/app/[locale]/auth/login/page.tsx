'use client';

import { useSearchParams } from 'next/navigation';
import AuthUnified from '../AuthUnified';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const reasonBanned = searchParams.get('reason') === 'banned';
  const returnUrl = searchParams.get('returnUrl') || undefined;
  return <AuthUnified initialMode="login" reasonBanned={reasonBanned} returnUrl={returnUrl} />;
}

