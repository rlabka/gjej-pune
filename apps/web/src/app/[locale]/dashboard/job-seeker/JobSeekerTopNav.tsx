'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { getSession, getDisplayName, logout, getToken } from '@/lib/auth';
import { getSocket } from '@/lib/socket';
import { api } from '@/lib/api';
import { getJobSeekerConfig } from '@/lib/siteConfig';
import { Bell, Menu, X, MessageSquare, User, ChevronDown, ChevronRight, LogOut, UserCircle, Settings, HelpCircle, Calendar, Eye, Mail, CheckCircle2, Zap, Megaphone, XCircle } from 'lucide-react';
import { HiOutlineChatBubbleLeft, HiOutlineBellAlert } from 'react-icons/hi2';
import { clsx } from 'clsx';
import { getNotifTitle, getNotifBody, getMarkAllReadLabel } from '@/lib/notificationLocale';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function JobSeekerTopNav() {
  const pathname = usePathname();
  const locale = useLocale();
  const router = useRouter();
  const session = getSession();
  const displayName = session ? getDisplayName(session) : 'Account';
  
  // Only show "Admin" if the user is explicitly an admin.
  // Otherwise, use the display name (which defaults to "Account" or "Imad Ed-din" for job seekers).
  const finalDisplayName = session?.role === 'admin' ? 'Admin' : displayName;

  const t = useTranslations('Dashboard.sidebar');
  const navT = useTranslations('Dashboard.jobSeekerNav');
  const headerT = useTranslations('Header');
  const menuRef = useRef<HTMLDivElement>(null);
  const msgRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const loadProfileImage = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await api.get<{ ok: boolean; profile: { image: string | null } }>('/api/settings/profile', token);
      if (res.ok && res.profile?.image) setProfileImage(res.profile.image);
    } catch {}
  }, []);

  useEffect(() => { loadProfileImage(); }, [loadProfileImage]);

  useEffect(() => {
    const handler = () => loadProfileImage();
    window.addEventListener('profile:imageUpdated', handler);
    return () => window.removeEventListener('profile:imageUpdated', handler);
  }, [loadProfileImage]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (msgRef.current && !msgRef.current.contains(e.target as Node)) {
        setMessagesOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openMessages = () => { setMessagesOpen(o => !o); setNotificationsOpen(false); setDropdownOpen(false); };
  const openNotifications = () => { setNotificationsOpen(o => !o); setMessagesOpen(false); setDropdownOpen(false); };

  const [msgItems, setMsgItems] = useState<{ logo: string; company: string; msg: string; time: string; unread: boolean }[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifItems, setNotifItems] = useState<{ id: string; type: string; title: string; body: string; read: boolean; createdAt: string; meta?: string }[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [notifCursor, setNotifCursor] = useState<string | null>(null);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifScrollRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const [convRes, countRes] = await Promise.all([
        api.get<{ ok: boolean; conversations: any[] }>('/api/messages/conversations', token),
        api.get<{ ok: boolean; count: number }>('/api/messages/unread-count', token),
      ]);
      if (convRes.ok) {
        setMsgItems(convRes.conversations.slice(0, 5).map((c: any) => ({
          logo: (c.partnerName || '?').charAt(0).toUpperCase(),
          company: c.partnerName || '?',
          msg: c.lastMessage || '',
          time: new Date(c.lastAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
          unread: c.unreadCount > 0,
        })));
      }
      if (countRes.ok) setUnreadCount(countRes.count);
    } catch {}
  }, [locale]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  const loadNotifications = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const [listRes, countRes] = await Promise.all([
        api.get<{ ok: boolean; notifications: any[]; nextCursor: string | null }>('/api/notifications?limit=15', token),
        api.get<{ ok: boolean; count: number }>('/api/notifications/unread-count', token),
      ]);
      if (listRes.ok) {
        setNotifItems(listRes.notifications);
        setNotifCursor(listRes.nextCursor);
      }
      if (countRes.ok) setUnreadNotifCount(countRes.count);
    } catch {}
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const loadMoreNotifications = useCallback(async () => {
    if (!notifCursor || notifLoading) return;
    const token = getToken();
    if (!token) return;
    setNotifLoading(true);
    try {
      const res = await api.get<{ ok: boolean; notifications: any[]; nextCursor: string | null }>(`/api/notifications?limit=15&cursor=${notifCursor}`, token);
      if (res.ok) {
        setNotifItems(prev => [...prev, ...res.notifications]);
        setNotifCursor(res.nextCursor);
      }
    } catch {}
    setNotifLoading(false);
  }, [notifCursor, notifLoading]);

  // WebSocket: listen for real-time notifications
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (notif: any) => {
      setNotifItems(prev => [notif, ...prev]);
      setUnreadNotifCount(prev => prev + 1);
    };
    socket.on('notification:new', handler);
    return () => { socket.off('notification:new', handler); };
  }, []);

  const markAllNotificationsRead = async () => {
    const token = getToken();
    if (!token) return;
    try {
      await api.put('/api/notifications/read-all', {}, token);
      setNotifItems(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadNotifCount(0);
    } catch {}
  };

  const handleNotificationClick = async (n: typeof notifItems[0]) => {
    setNotificationsOpen(false);
    // Mark as read
    if (!n.read) {
      const token = getToken();
      if (token) {
        api.put(`/api/notifications/${n.id}/read`, {}, token).catch(() => {});
        setNotifItems(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
        setUnreadNotifCount(prev => Math.max(0, prev - 1));
      }
    }
    // Navigate
    const hrefMap: Record<string, string> = {
      profile_view: '/dashboard/job-seeker/profile-views',
      premium_activated: '/dashboard/job-seeker/settings',
      boost_active: '/dashboard/job-seeker/settings',
      premium_cancelled: '/dashboard/job-seeker/settings',
      ad_online: '/dashboard/job-seeker/my-ads',
    };
    const href = hrefMap[n.type];
    if (href) router.push(href);
  };

  const handleSignOut = async () => {
    await logout();
    window.location.href = `/${locale}/auth/login`;
  };

  const jsConfig = getJobSeekerConfig();
  const sectionLinks = [
    { href: '/dashboard/job-seeker', key: 'overview' as const, show: true },
    { href: '/dashboard/job-seeker/applications', key: 'myApplications' as const, show: jsConfig.features.showApplications },
    { href: '/dashboard/job-seeker/saved', key: 'savedJobs' as const, show: jsConfig.features.showSavedJobs }
  ].filter((l) => l.show);

  return (
    <>
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-3 sm:px-6 lg:px-8 sticky top-0 z-40">
      {/* Left: Logo + Language */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 shrink">
        <Link href="/" className="flex items-center group shrink-0">
          <img src="/logo.png" alt="gjej-pune.com" className="h-8 sm:h-9 w-auto object-contain" />
        </Link>
        <LanguageSwitcher />
      </div>

      {/* Right: Nav + Icons */}
      <div className="flex items-center gap-1.5 sm:gap-3 lg:gap-4 shrink-0">
        <nav className="hidden md:flex items-center gap-6" aria-label="My career sections">
          {sectionLinks.map(({ href, key }) => {
            const isActive =
              href === '/dashboard/job-seeker'
                ? pathname === href
                : pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'py-1 text-sm font-semibold whitespace-nowrap transition-all border-b-2',
                  isActive
                    ? 'text-[#162C66] border-[#162C66]'
                    : 'text-slate-500 border-transparent hover:text-[#162C66] hover:border-slate-300'
                )}
              >
                {navT(key)}
              </Link>
            );
          })}
        </nav>
        <div className="h-8 w-px bg-slate-200 hidden md:block" />

        {jsConfig.features.showMessages && (
          <div className="relative" ref={msgRef}>
            <button
              type="button"
              onClick={openMessages}
              className={clsx(
                'relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors',
                messagesOpen || pathname.startsWith('/dashboard/job-seeker/messages')
                  ? 'text-[#162C66] bg-slate-100'
                  : 'text-slate-500 hover:text-[#162C66] hover:bg-slate-50'
              )}
              aria-label={navT('messages')}
              aria-expanded={messagesOpen}
              aria-haspopup="true"
            >
              <HiOutlineChatBubbleLeft className="w-[19px] h-[19px]" />
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#162C66] rounded-full ring-2 ring-white" aria-hidden />}
            </button>
            {messagesOpen && (
              <div className="fixed sm:absolute right-4 sm:right-0 left-4 sm:left-auto top-16 sm:top-full sm:mt-2 sm:w-80 bg-white rounded-xl border border-slate-100 shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#0B1F44]">{navT('messages')}</h3>
                  {unreadCount > 0 && <span className="text-[10px] font-bold text-white bg-[#162C66] px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {msgItems.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <HiOutlineChatBubbleLeft className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-[13px] text-slate-400">{navT('noMessages')}</p>
                    </div>
                  ) : (
                    msgItems.map((item, i) => (
                      <Link
                        key={i}
                        href="/dashboard/job-seeker/messages"
                        onClick={() => setMessagesOpen(false)}
                        className={clsx('flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0', item.unread && 'bg-slate-50/50')}
                      >
                        <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0', item.unread ? 'bg-[#162C66] text-white' : 'bg-slate-100 text-[#162C66]')}>
                          {item.logo}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={clsx('text-[13px] truncate', item.unread ? 'font-semibold text-[#0B1F44]' : 'font-medium text-slate-600')}>{item.company}</span>
                            <span className="text-[10px] text-slate-400 shrink-0">{item.time}</span>
                          </div>
                          <p className="text-[12px] text-slate-400 truncate">{item.msg}</p>
                        </div>
                        {item.unread && <span className="w-2 h-2 bg-[#162C66] rounded-full shrink-0 mt-2" />}
                      </Link>
                    ))
                  )}
                </div>
                <Link
                  href="/dashboard/job-seeker/messages"
                  onClick={() => setMessagesOpen(false)}
                  className="block text-center py-2.5 text-[13px] font-semibold text-[#162C66] hover:bg-slate-50 border-t border-slate-100 transition-colors"
                >
                  {navT('messages')} →
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={openNotifications}
            className={clsx(
              'relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors',
              notificationsOpen
                ? 'text-[#162C66] bg-slate-100'
                : 'text-slate-500 hover:text-[#162C66] hover:bg-slate-50'
            )}
            aria-label={navT('notifications')}
            aria-expanded={notificationsOpen}
            aria-haspopup="true"
          >
            <HiOutlineBellAlert className="w-[19px] h-[19px]" />
            {unreadNotifCount > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">{unreadNotifCount}</span>}
          </button>
          {notificationsOpen && (
            <div className="fixed sm:absolute right-4 sm:right-0 left-4 sm:left-auto top-16 sm:top-full sm:mt-2 sm:w-80 bg-white rounded-xl border border-slate-100 shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#0B1F44]">{navT('notifications')}</h3>
                {unreadNotifCount > 0 && (
                  <button onClick={markAllNotificationsRead} className="text-[11px] font-semibold text-[#162C66] hover:underline">{getMarkAllReadLabel(locale)}</button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto" ref={notifScrollRef} onScroll={(e) => { const el = e.currentTarget; if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) loadMoreNotifications(); }}>
                {notifItems.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <HiOutlineBellAlert className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-[13px] text-slate-400">{navT('noNotifications')}</p>
                  </div>
                ) : (
                  notifItems.map((n) => (
                    <div key={n.id} role="button" tabIndex={0} onMouseDown={() => handleNotificationClick(n)} onKeyDown={(e) => e.key === 'Enter' && handleNotificationClick(n)} className={clsx('block px-4 py-3 border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50 cursor-pointer', !n.read && 'bg-blue-50/40')}>
                      <div className="flex items-start gap-3">
                        <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5', n.type === 'premium_activated' ? 'bg-yellow-100' : n.type === 'boost_active' ? 'bg-purple-100' : n.type === 'profile_view' ? 'bg-blue-100' : n.type === 'ad_online' ? 'bg-green-100' : n.type === 'premium_cancelled' ? 'bg-red-100' : 'bg-slate-100')}>
                          {n.type === 'premium_activated' && <CheckCircle2 size={14} className="text-yellow-600" />}
                          {n.type === 'boost_active' && <Zap size={14} className="text-purple-600" />}
                          {n.type === 'profile_view' && <Eye size={14} className="text-blue-600" />}
                          {n.type === 'ad_online' && <Megaphone size={14} className="text-green-600" />}
                          {n.type === 'premium_cancelled' && <XCircle size={14} className="text-red-500" />}
                          {!['premium_activated', 'boost_active', 'profile_view', 'ad_online', 'premium_cancelled'].includes(n.type) && <Mail size={14} className="text-slate-500" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-[#0B1F44] truncate">{getNotifTitle(n, locale)}</p>
                          <p className="text-[12px] text-slate-500 line-clamp-2">{getNotifBody(n, locale)}</p>
                          <p className="text-[11px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString(locale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2" />}
                      </div>
                    </div>
                  ))
                )}
                {notifLoading && (
                  <div className="py-3 flex justify-center">
                    <div className="w-5 h-5 border-2 border-slate-200 border-t-[#162C66] rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200 hidden sm:block" />

        {/* User menu – desktop */}
        <div className="relative hidden sm:block" ref={menuRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 pl-2 pr-2.5 py-2 rounded-xl hover:bg-slate-50 transition-colors"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            aria-label={navT('userMenuAria')}
          >
            {profileImage ? (
              <img src={profileImage.startsWith('/uploads/') ? `${API_URL}${profileImage}` : profileImage} alt="" className="w-9 h-9 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="w-9 h-9 bg-[#162C66] rounded-xl flex items-center justify-center text-white shrink-0">
                <User size={16} />
              </div>
            )}
            <span className="text-sm font-semibold text-[#162C66] max-w-[120px] truncate">
              {finalDisplayName}
            </span>
            <ChevronDown
              size={14}
              className={clsx('text-slate-400 shrink-0 transition-transform', dropdownOpen && 'rotate-180')}
            />
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl border border-slate-100 shadow-lg py-2 z-50"
              role="menu"
            >
              {jsConfig.features.showProfile && (
                <Link
                  href="/dashboard/job-seeker/profile"
                  role="menuitem"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#162C66] hover:bg-slate-50"
                >
                  <UserCircle size={18} className="text-slate-400" />
                  {navT('myProfile')}
                </Link>
              )}
              <Link
                href="/dashboard/job-seeker/settings"
                role="menuitem"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#162C66] hover:bg-slate-50"
              >
                <Settings size={18} className="text-slate-400" />
                {navT('myAccountSettings')}
              </Link>
              <div className="border-t border-slate-100 my-2" />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setDropdownOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-red-600 text-left"
              >
                <LogOut size={18} className="text-slate-400" />
                {t('signOut')}
              </button>
            </div>
          )}
        </div>

        {/* User avatar – mobile only (no dropdown, just avatar) */}
        {profileImage ? (
          <img src={profileImage.startsWith('/uploads/') ? `${API_URL}${profileImage}` : profileImage} alt="" className="sm:hidden w-8 h-8 rounded-full object-cover shrink-0" />
        ) : (
          <div className="sm:hidden w-8 h-8 bg-[#162C66] rounded-full flex items-center justify-center text-white shrink-0">
            <User size={16} />
          </div>
        )}

        {/* Burger menu – always visible on mobile */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((o) => !o)}
          className="sm:hidden w-9 h-9 flex items-center justify-center rounded-full text-[#162C66] hover:bg-slate-50 transition-colors"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>

    {/* Mobile slide-down menu */}
    {mobileMenuOpen && (
      <div className="sm:hidden bg-white border-b border-slate-200 py-6 px-4 space-y-6 shadow-lg fixed top-16 left-0 w-full z-30 overflow-y-auto max-h-[calc(100dvh-4rem)]">
        <nav className="flex flex-col space-y-1">
          {sectionLinks.map(({ href, key }) => {
            const isActive =
              href === '/dashboard/job-seeker'
                ? pathname === href
                : pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className={clsx(
                  'flex items-center justify-between px-3 py-3 rounded-xl text-[15px] font-semibold transition-colors',
                  isActive
                    ? 'text-[#162C66] bg-slate-50'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-[#162C66]'
                )}
              >
                <span>{navT(key)}</span>
                <ChevronRight size={18} className="text-slate-400" />
              </Link>
            );
          })}
          {jsConfig.features.showMessages && (
            <Link
              href="/dashboard/job-seeker/messages"
              onClick={() => setMobileMenuOpen(false)}
              className={clsx(
                'flex items-center justify-between px-3 py-3 rounded-xl text-[15px] font-semibold transition-colors',
                pathname.startsWith('/dashboard/job-seeker/messages')
                  ? 'text-[#162C66] bg-slate-50'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-[#162C66]'
              )}
            >
              <span>{navT('messages')}</span>
              <ChevronRight size={18} className="text-slate-400" />
            </Link>
          )}
        </nav>

        <div className="border-t border-slate-100 pt-4 space-y-1">
          {jsConfig.features.showProfile && (
            <Link
              href="/dashboard/job-seeker/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#162C66]"
            >
              <UserCircle size={18} className="text-slate-400" />
              {navT('myProfile')}
            </Link>
          )}
          <Link
            href="/dashboard/job-seeker/settings"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#162C66]"
          >
            <Settings size={18} className="text-slate-400" />
            {navT('myAccountSettings')}
          </Link>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              handleSignOut();
            }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-semibold text-slate-500 hover:bg-slate-50 hover:text-red-600"
          >
            <LogOut size={18} className="text-slate-400" />
            {t('signOut')}
          </button>
        </div>
      </div>
    )}
    </>
  );
}
