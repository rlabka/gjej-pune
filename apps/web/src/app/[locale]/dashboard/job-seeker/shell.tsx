'use client';

import type { ReactNode } from 'react';
import { usePathname } from '@/i18n/routing';
import Header from '@/components/Header';

export default function JobSeekerDashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isMessagesPage = pathname.startsWith('/dashboard/job-seeker/messages');

  return (
    <div className={isMessagesPage ? 'flex flex-col h-dvh bg-[#f8f9fc]' : 'flex flex-col min-h-dvh bg-[#f8f9fc]'}>
      <Header />
      <main className={isMessagesPage ? 'flex-1 overflow-hidden' : 'flex-grow px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 overflow-x-hidden'}>
        <div className={isMessagesPage ? 'h-full max-w-7xl mx-auto' : 'max-w-[1280px] mx-auto'}>{children}</div>
      </main>
    </div>
  );
}

