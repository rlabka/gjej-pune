'use client';

import { Link, usePathname } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { clsx } from 'clsx';
import { logout } from '@/lib/auth';
import { getJobSeekerConfig } from '@/lib/siteConfig';
import {
  LayoutDashboard,
  Search,
  Briefcase,
  Star,
  MessageSquare,
  User,
  Settings,
  LogOut
} from 'lucide-react';

export default function JobSeekerSidebar() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('Dashboard.sidebar');

  const jsConfig = getJobSeekerConfig();

  const links = [
    { href: '/dashboard/job-seeker', label: t('dashboard'), icon: LayoutDashboard, show: true },
    { href: '/dashboard/job-seeker/jobs', label: t('findJobs'), icon: Search, show: true },
    { href: '/dashboard/job-seeker/applications', label: t('myApplications'), icon: Briefcase, show: jsConfig.features.showApplications },
    { href: '/dashboard/job-seeker/saved', label: t('savedJobs'), icon: Star, show: jsConfig.features.showSavedJobs },
    { href: '/dashboard/job-seeker/messages', label: t('messages'), icon: MessageSquare, show: jsConfig.features.showMessages },
    { href: '/dashboard/job-seeker/profile', label: t('profile'), icon: User, show: jsConfig.features.showProfile },
    { href: '/dashboard/job-seeker/settings', label: t('settings'), icon: Settings, show: true }
  ].filter((l) => l.show);

  return (
    <aside className="w-72 bg-[#162C66] text-white flex flex-col h-dvh sticky top-0 overflow-y-auto">
      <div className="p-8 pb-10">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 bg-[#F5C400] rounded-xl flex items-center justify-center shadow-lg shadow-[#F5C400]/20 group-hover:scale-110 transition-transform duration-300">
            <span
              aria-hidden="true"
              className="text-[#162C66] font-black leading-none"
              style={{ fontSize: 24 }}
            >
              G
            </span>
          </div>
          <span className="text-xl font-black tracking-tight text-white group-hover:text-[#F5C400] transition-colors duration-300">
            gjejpune24<span className="text-[#F5C400]">.com</span>
          </span>
        </Link>
      </div>

      <nav className="flex-grow px-4">
        <ul className="space-y-1.5">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={clsx(
                    'flex items-center space-x-3 px-4 py-3.5 rounded-xl font-bold transition-all text-[15px] group',
                    isActive
                      ? 'bg-white/10 text-[#F5C400]'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                >
                  <span
                    className={clsx(
                      'flex-shrink-0 transition-colors',
                      isActive ? 'text-[#F5C400]' : 'text-white/40 group-hover:text-white'
                    )}
                  >
                    <Icon size={20} />
                  </span>
                  <span>{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 pb-6 pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={async () => {
            await logout();
            window.location.href = `/${locale}/auth/login`;
          }}
          className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all text-[15px] group"
        >
          <span className="flex-shrink-0 text-white/40 group-hover:text-white transition-colors">
            <LogOut size={20} />
          </span>
          <span>{t('signOut')}</span>
        </button>
      </div>
    </aside>
  );
}

