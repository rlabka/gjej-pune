'use client';

import { ReactNode } from 'react';
import { Link, usePathname } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { logout } from '@/lib/auth';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Globe, Scale, LogOut, Menu, X, ExternalLink, Settings, Users, Briefcase, FileText, BookOpen, CreditCard, FolderOpen, Search, Megaphone } from 'lucide-react';
import { clsx } from 'clsx';
import { useState, useEffect } from 'react';

export default function AdminShell({ children }: { children: ReactNode }) {
  const t = useTranslations('Admin');
  const pathname = usePathname();
  const locale = useLocale();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navItems = [
    { href: '/admin', labelKey: 'cmsLandingPage', icon: Globe, exact: true },
    { href: '/admin/pages', labelKey: 'cmsPages', icon: BookOpen },
    { href: '/admin/legal', labelKey: 'cmsLegal', icon: Scale },
    { href: '/admin/users', labelKey: 'navUsers', icon: Users },
    { href: '/admin/jobs', labelKey: 'navAds', icon: FileText },
    { href: '/admin/categories', labelKey: 'navCategories', icon: FolderOpen },
    { href: '/admin/subscriptions', labelKey: 'navSubscriptions', icon: CreditCard },
    { href: '/admin/ad-placements', labelKey: 'navAdPlacements', icon: Megaphone },
    { href: '/admin/seo', labelKey: 'navSeo', icon: Search },
    { href: '/admin/settings', labelKey: 'settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-[#F7F7F7]">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#162C66] text-white p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#F5C400] rounded-lg flex items-center justify-center">
            <span aria-hidden="true" className="text-[#162C66] font-black leading-none text-base">CMS</span>
          </div>
          <span className="font-bold text-sm">{t('cmsTitle')}</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 lg:w-56 xl:w-64 bg-[#162C66] text-white flex flex-col h-screen transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none',
          'lg:translate-x-0 lg:static lg:h-screen lg:sticky lg:top-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Desktop Logo */}
        <div className="p-8 pb-6 hidden lg:block">
          <Link href="/admin" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-[#F5C400] rounded-xl flex items-center justify-center shadow-lg shadow-[#F5C400]/20 group-hover:scale-105 transition-transform duration-200">
              <span aria-hidden="true" className="text-[#162C66] font-black leading-none text-sm">CMS</span>
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white group-hover:text-[#F5C400] transition-colors duration-200 block">
                {t('cmsTitle')}
              </span>
              <span className="text-xs text-white/60">{t('cmsSubtitle')}</span>
            </div>
          </Link>
        </div>

        {/* Mobile Logo */}
        <div className="p-8 pb-6 lg:hidden pt-20">
          <Link href="/admin" className="flex items-center space-x-3 group" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="w-10 h-10 bg-[#F5C400] rounded-xl flex items-center justify-center shadow-lg shadow-[#F5C400]/20">
              <span aria-hidden="true" className="text-[#162C66] font-black leading-none text-sm">CMS</span>
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white block">{t('cmsTitle')}</span>
              <span className="text-xs text-white/60">{t('cmsSubtitle')}</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 overflow-y-auto" aria-label="Admin navigation">
          <p className="px-4 mb-3 text-[11px] font-bold uppercase tracking-wider text-white/40">
            {t('cmsNavContent')}
          </p>
          <ul className="space-y-1.5">
            {navItems.map(({ href, labelKey, icon: Icon, exact }) => {
              const isActive = exact
                ? pathname === href
                : pathname === href || pathname.startsWith(href + '/');
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={clsx(
                      'flex items-center space-x-3 px-4 py-3.5 rounded-xl font-bold transition-all text-[15px] group',
                      isActive ? 'bg-white/10 text-[#F5C400]' : 'text-white/60 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <span className={clsx('flex-shrink-0 transition-colors', isActive ? 'text-[#F5C400]' : 'text-white/40 group-hover:text-white')}>
                      <Icon size={20} />
                    </span>
                    <span>{t(labelKey)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-8">
            <p className="px-4 mb-3 text-[11px] font-bold uppercase tracking-wider text-white/40">
              {t('cmsNavPreview')}
            </p>
            <a
              href={`/${locale}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 px-4 py-3.5 rounded-xl font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all text-[15px] group"
            >
              <span className="flex-shrink-0 text-white/40 group-hover:text-white transition-colors">
                <ExternalLink size={20} />
              </span>
              <span>{t('cmsPreviewSite')}</span>
            </a>
          </div>
        </nav>

        <div className="px-4 pb-4 pt-2 border-t border-white/10">
          <div className="mb-3">
            <LanguageSwitcher variant="list" />
          </div>
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

      <div className="flex-grow flex flex-col min-h-screen min-w-0 pt-16 lg:pt-0">
        <main className="flex-1 p-4 lg:p-10 overflow-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
