'use client';

import AuthUnified from '../../AuthUnified';

export const dynamic = 'force-dynamic';

export default function JobSeekerRegisterPage() {
  return <AuthUnified initialMode="register" registrationRole="job-seeker" />;
}
