'use client';

import { Link, usePathname } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { clsx } from 'clsx';
import { logout } from '@/lib/auth';
import { useSidebar } from './SidebarContext';
import { getThemeConfig } from '@/lib/siteConfig';
import {
  LayoutDashboard,
  Briefcase,
  Plus,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  X,
  Search,
  Heart,
  MessageSquare,
} from 'lucide-react';

export default function EmployerSidebar() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('Dashboard.sidebar');
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebar();
  const themeConfig = getThemeConfig();

  const mainLinks = [
    { href: '/dashboard/employer', label: t('overview'), icon: LayoutDashboard },
    { href: '/dashboard/employer/jobs', label: t('myJobs'), icon: Briefcase },
    { href: '/dashboard/employer/candidates', label: t('findCandidates'), icon: Search },
    { href: '/dashboard/employer/favorites', label: t('favoriteCandidates'), icon: Heart },
    { href: '/dashboard/employer/messages', label: t('messages'), icon: MessageSquare },
  ];


  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: typeof LayoutDashboard }) => {
    const isActive = pathname === href;
    return (
      <li>
        <Link
          href={href}
          title={collapsed ? label : undefined}
          onClick={() => setMobileOpen(false)}
          className={clsx(
            'relative flex items-center gap-3 rounded-xl font-medium transition-all duration-200 text-[14px] group',
            collapsed ? 'justify-center px-3 py-3' : 'px-4 py-2.5',
            isActive
              ? 'bg-white/[0.08] text-white'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          )}
        >
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#F5C400] rounded-r-full" />
          )}
          <span className={clsx(
            'flex-shrink-0 transition-colors',
            isActive ? 'text-[#F5C400]' : 'text-slate-500 group-hover:text-white'
          )}>
            <Icon size={20} />
          </span>
          {!collapsed && <span className="truncate">{label}</span>}
        </Link>
      </li>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={clsx(
          'bg-[#0B1A3B] text-white flex flex-col h-dvh overflow-y-auto overflow-x-hidden border-r border-white/[0.04] transition-all duration-300 ease-in-out',
          // Desktop: sticky sidebar
          'hidden lg:flex lg:sticky lg:top-0',
          collapsed ? 'lg:w-[72px]' : 'lg:w-[260px]',
          // Mobile: fixed drawer
          mobileOpen && '!fixed inset-y-0 left-0 z-50 !flex w-[280px]'
        )}
      >
      {/* Logo */}
      <div className={clsx('shrink-0', collapsed ? 'px-2 py-5' : 'px-5 pt-6 pb-8')}>
        <Link href="/" className="group flex items-center gap-3">
          <div className={clsx(
            'shrink-0 transition-transform duration-200 group-hover:scale-105',
            collapsed ? 'w-11 h-11' : 'w-10 h-10'
          )}>
            <img src="/logo-mark.svg" alt="" className="w-full h-full drop-shadow-[0_2px_8px_rgba(245,196,0,0.25)]" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex flex-col">
              <span className="text-[16px] font-extrabold tracking-tight leading-none">
                <span className="text-[#F5C400]">gjej</span>
                <span className="text-white/60 font-bold">-</span>
                <span className="text-white">pune</span>
              </span>
              <span className="text-[10px] font-semibold text-white/30 tracking-widest uppercase mt-1">Job Platform</span>
            </div>
          )}
        </Link>
      </div>

      {/* Post Job CTA */}
      <div className={clsx('shrink-0 mb-8', collapsed ? 'px-3' : 'px-5')}>
        <Link
          href="/dashboard/employer/jobs/new"
          title={collapsed ? t('postJob') : undefined}
          className={clsx(
            'flex items-center justify-center gap-2 bg-[#F5C400] text-[#0B1A3B] rounded-xl font-bold text-sm hover:bg-[#FFD633] transition-all duration-200',
            collapsed ? 'w-full py-3' : 'w-full py-2.5 px-4'
          )}
        >
          <Plus size={18} strokeWidth={2.5} />
          {!collapsed && <span>{t('postJob')}</span>}
        </Link>
      </div>

      {/* Main Nav */}
      <nav className="flex-grow px-3">
        {!collapsed && (
          <p className="px-4 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{t('recruiting')}</p>
        )}
        <ul className="space-y-1">
          {mainLinks.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </ul>

      </nav>

      {/* Footer: Logout + Collapse */}
      <div className="shrink-0 px-3 pb-4 pt-3 mt-auto border-t border-white/[0.06]">
        <button
          type="button"
          onClick={async () => {
            await logout();
            window.location.href = `/${locale}/auth/login`;
          }}
          title={collapsed ? t('signOut') : undefined}
          className={clsx(
            'w-full flex items-center gap-3 rounded-xl font-medium text-slate-500 hover:text-white hover:bg-white/[0.04] transition-all duration-200 text-[14px] group',
            collapsed ? 'justify-center px-3 py-3' : 'px-4 py-2.5'
          )}
        >
          <LogOut size={18} className="shrink-0 group-hover:text-white transition-colors" />
          {!collapsed && <span>{t('signOut')}</span>}
        </button>

        <button
          type="button"
          onClick={toggle}
          className={clsx(
            'w-full flex items-center gap-3 rounded-xl font-medium text-slate-600 hover:text-white hover:bg-white/[0.04] transition-all duration-200 text-[13px] mt-1',
            collapsed ? 'justify-center px-3 py-2.5' : 'px-4 py-2'
          )}
        >
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          {!collapsed && <span className="text-slate-500">{t('collapse')}</span>}
        </button>
      </div>
      </aside>
    </>
  );
}

