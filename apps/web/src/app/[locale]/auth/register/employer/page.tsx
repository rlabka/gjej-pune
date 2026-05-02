'use client';

import AuthUnified from '../../AuthUnified';

export const dynamic = 'force-dynamic';

export default function EmployerRegisterPage() {
  return <AuthUnified initialMode="register" registrationRole="employer" />;
}
