'use client';

import { ChevronRight, ChevronDown, Menu, BarChart3, Settings, LogOut } from 'lucide-react';
import { HiOutlineChatBubbleLeft, HiOutlineBellAlert } from 'react-icons/hi2';
import { logout } from '@/lib/auth';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, Link } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { getSession, getDisplayName, getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useSidebar } from '@/app/[locale]/dashboard/employer/SidebarContext';
import { clsx } from 'clsx';

function Breadcrumbs() {
  const pathname = usePathname();
  const t = useTranslations('Dashboard.sidebar');
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = segments.filter(s => s !== 'de' && s !== 'en' && s !== 'fr' && s !== 'it' && s !== 'sq');

  const labelMap: Record<string, string> = {
    dashboard: 'Dashboard',
    employer: t('overview'),
    jobs: t('myJobs'),
    new: 'New',
    applications: t('applications'),
    candidates: t('applications'),
    analytics: t('analytics'),
    messages: t('messages'),
    settings: t('settings'),
    company: t('company'),
  };

  return (
    <nav className="flex items-center gap-1.5 text-sm">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        const label = labelMap[crumb] || crumb;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={14} className="text-slate-300" />}
            <span className={isLast ? 'font-semibold text-[#0B1F44]' : 'text-slate-400 font-medium'}>
              {label}
            </span>
          </span>
        );
      })}
    </nav>
  );
}


export default function Topbar() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { setMobileOpen } = useSidebar();
  const t = useTranslations('Dashboard.topbar');
  const locale = useLocale();
  const notifRef = useRef<HTMLDivElement>(null);
  const msgRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [session, setSession] = useState<ReturnType<typeof getSession>>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [msgItems, setMsgItems] = useState<{ id: string; logo: string; image: string | null; name: string; msg: string; time: string; unread: boolean }[]>([]);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => { setSession(getSession()); }, []);

  // Load profile image
  const loadProfileImage = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await api.get<{ ok: boolean; profile: { image: string | null } }>('/api/settings/profile', token);
      if (res.ok && res.profile?.image) setProfileImage(res.profile.image);
    } catch {}
  }, []);

  useEffect(() => { loadProfileImage(); }, [loadProfileImage]);

  // Listen for profile image updates
  useEffect(() => {
    const handler = () => loadProfileImage();
    window.addEventListener('profile:imageUpdated', handler);
    return () => window.removeEventListener('profile:imageUpdated', handler);
  }, [loadProfileImage]);

  const loadMessages = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const [convRes, countRes] = await Promise.all([
        api.get<{ ok: boolean; conversations: any[] }>('/api/messages/conversations', token),
        api.get<{ ok: boolean; count: number }>('/api/messages/unread-count', token),
      ]);
      if (convRes.ok) {
        setMsgItems(convRes.conversations.filter((c: any) => c.lastMessage).slice(0, 5).map((c: any) => ({
          id: c.id,
          logo: (c.partnerName || '?').charAt(0).toUpperCase(),
          image: c.partnerImage || null,
          name: c.partnerName || '?',
          msg: c.lastMessage || '',
          time: new Date(c.lastAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
          unread: c.unreadCount > 0,
        })));
      }
      if (countRes.ok) setUnreadMsgCount(countRes.count);
    } catch {}
  }, [locale]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  useEffect(() => {
    const refresh = () => loadMessages();
    window.addEventListener('messages:updated', refresh);
    return () => window.removeEventListener('messages:updated', refresh);
  }, [loadMessages]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onNewMsg = () => { console.log('[Topbar] message:new received'); loadMessages(); };
    const onSent = () => { console.log('[Topbar] message:sent received'); loadMessages(); };
    socket.on('message:new', onNewMsg);
    socket.on('message:sent', onSent);
    return () => { socket.off('message:new', onNewMsg); socket.off('message:sent', onSent); };
  }, [loadMessages]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (msgRef.current && !msgRef.current.contains(e.target as Node)) setShowMessages(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = session ? getDisplayName(session) : '';
  const initials = displayName ? displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'U';

  const openMessages = () => { setShowMessages(o => !o); setShowNotifications(false); };
  const openNotifications = () => { setShowNotifications(o => !o); setShowMessages(false); };

  return (
    <header className="h-14 sm:h-[68px] bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-3 sm:px-6 lg:px-8 sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-[#0B1F44] hover:bg-slate-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div className="hidden sm:block">
          <Breadcrumbs />
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        <LanguageSwitcher />

        {/* Messages */}
        <div className="relative" ref={msgRef}>
          <button
            onClick={openMessages}
            className={clsx(
              'relative w-10 h-10 flex items-center justify-center rounded-xl transition-all',
              showMessages ? 'text-[#0B1F44] bg-[#162C66]/[0.06]' : 'text-slate-400 hover:text-[#0B1F44] hover:bg-slate-50'
            )}
          >
            <HiOutlineChatBubbleLeft className="w-[21px] h-[21px]" />
            {unreadMsgCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />}
          </button>

          {showMessages && (
            <div className="fixed sm:absolute right-2 sm:right-0 top-14 sm:top-full sm:mt-2 w-[calc(100vw-16px)] sm:w-80 bg-white rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] border border-slate-200/60 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-[#0B1F44]">{t('messages')}</span>
                {unreadMsgCount > 0 && (
                  <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-full">
                    {unreadMsgCount}
                  </span>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {msgItems.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <HiOutlineChatBubbleLeft className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-[13px] text-slate-400">{t('noMessages')}</p>
                  </div>
                ) : (
                  msgItems.map((m, i) => (
                    <a
                      key={i}
                      href={`/${locale}/dashboard/employer/messages?conv=${m.id}`}
                      onClick={() => setShowMessages(false)}
                      className={clsx(
                        'flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer',
                        m.unread && 'bg-slate-50/50'
                      )}
                    >
                      {m.image ? (
                        <img src={m.image.startsWith('/uploads/') ? `${API_URL}${m.image}` : m.image} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0', m.unread ? 'bg-[#162C66] text-white' : 'bg-slate-100 text-[#162C66]')}>
                          {m.logo}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={clsx('text-[13px] truncate', m.unread ? 'font-semibold text-[#0B1F44]' : 'font-medium text-slate-600')}>
                            {m.name}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">{m.time}</span>
                        </div>
                        <p className="text-[12px] text-slate-400 truncate">{m.msg}</p>
                      </div>
                      {m.unread && <span className="w-2 h-2 bg-[#162C66] rounded-full shrink-0 mt-2" />}
                    </a>
                  ))
                )}
              </div>
              <a
                href={`/${locale}/dashboard/employer/messages`}
                onClick={() => setShowMessages(false)}
                className="block text-center py-2.5 text-[13px] font-semibold text-[#162C66] hover:bg-slate-50 border-t border-slate-100 transition-colors cursor-pointer"
              >
                {t('viewAllMessages')} →
              </a>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={openNotifications}
            className={clsx(
              'relative w-10 h-10 flex items-center justify-center rounded-xl transition-all',
              showNotifications ? 'text-[#0B1F44] bg-[#162C66]/[0.06]' : 'text-slate-400 hover:text-[#0B1F44] hover:bg-slate-50'
            )}
          >
            <HiOutlineBellAlert className="w-[21px] h-[21px]" />
          </button>

          {showNotifications && (
            <div className="fixed sm:absolute right-2 sm:right-0 top-14 sm:top-full sm:mt-2 w-[calc(100vw-16px)] sm:w-80 bg-white rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] border border-slate-200/60 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-[#0B1F44]">{t('notifications')}</span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                <div className="px-4 py-6 text-center">
                  <HiOutlineBellAlert className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-[13px] text-slate-400">{t('noNotifications')}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-7 w-px bg-slate-200 mx-0.5 sm:mx-2" />

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => { setShowUserMenu(o => !o); setShowMessages(false); setShowNotifications(false); }}
            className={clsx(
              'flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl transition-all',
              showUserMenu ? 'bg-slate-100' : 'hover:bg-slate-50'
            )}
          >
            {profileImage ? (
              <img src={profileImage.startsWith('/uploads/') ? `${API_URL}${profileImage}` : profileImage} alt="" className="w-9 h-9 rounded-full object-cover shadow-sm ring-2 ring-white" />
            ) : (
              <div className="w-9 h-9 bg-gradient-to-br from-[#162C66] to-[#0B1A3B] rounded-full flex items-center justify-center text-white text-[12px] font-bold shadow-sm ring-2 ring-white">
                {initials}
              </div>
            )}
            <div className="text-left hidden md:block">
              <p className="text-[13px] font-semibold text-[#0B1F44] leading-tight truncate max-w-[140px]">{displayName || 'User'}</p>
            </div>
            <ChevronDown size={14} className={clsx('text-slate-400 hidden md:block transition-transform', showUserMenu && 'rotate-180')} />
          </button>

          {showUserMenu && (
            <div className="fixed sm:absolute right-2 sm:right-0 top-14 sm:top-full sm:mt-2 w-[calc(100vw-16px)] sm:w-64 bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-200/60 z-50 overflow-hidden">
              <div className="px-5 py-4 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
                <div className="flex items-center gap-3">
                  {profileImage ? (
                    <img src={profileImage.startsWith('/uploads/') ? `${API_URL}${profileImage}` : profileImage} alt="" className="w-11 h-11 rounded-full object-cover shadow-md ring-2 ring-white" />
                  ) : (
                    <div className="w-11 h-11 bg-gradient-to-br from-[#162C66] to-[#0B1A3B] rounded-full flex items-center justify-center text-white text-[14px] font-bold shadow-md ring-2 ring-white">
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-[#0B1F44] truncate">{displayName || 'User'}</p>
                    <p className="text-[11px] text-slate-400 truncate">{session?.email || ''}</p>
                  </div>
                </div>
              </div>
              <div className="py-1.5">
                <a
                  href={`/${locale}/dashboard/employer/settings`}
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 px-5 py-2.5 text-[13px] font-medium text-slate-600 hover:text-[#0B1F44] hover:bg-slate-50 transition-colors"
                >
                  <Settings size={16} className="text-slate-400" />
                  {t('settings')}
                </a>
              </div>
              <div className="border-t border-slate-100 py-1.5">
                <button
                  type="button"
                  onClick={async () => { await logout(); window.location.href = `/${locale}/auth/login`; }}
                  className="w-full flex items-center gap-3 px-5 py-2.5 text-[13px] font-medium text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  {t('signOut')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
