'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { getSession, getDisplayName, logout, getToken, type AuthRole } from '@/lib/auth';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { getThemeConfig, getJobSeekerConfig, CONFIG_UPDATED_EVENT } from '@/lib/siteConfig';
import LanguageSwitcher from './LanguageSwitcher';
import { getNotifTitle, getNotifBody, getMarkAllReadLabel } from '@/lib/notificationLocale';
import {
  Menu,
  X,
  Search,
  MapPin,
  HelpCircle,
  User,
  ChevronRight,
  ChevronDown,
  LogOut,
  UserCircle,
  Settings,
  LayoutDashboard,
  ShieldCheck,
  Crown,
  Briefcase,
  Bookmark,
  Plus,
  Calendar,
  Eye,
  Mail,
  CheckCircle2,
  Zap,
  Megaphone,
  XCircle
} from 'lucide-react';
import { HiOutlineChatBubbleLeft, HiOutlineBellAlert } from 'react-icons/hi2';
import { useState, useEffect, useRef, useCallback } from 'react';
import { clsx } from 'clsx';
import LocationAutocomplete from '@/components/LocationAutocomplete';

export default function Header() {
  const t = useTranslations('Header');
  const sidebarT = useTranslations('Dashboard.sidebar');
  const navT = useTranslations('Dashboard.jobSeekerNav');
  const locale = useLocale();
  const router = useRouter();
  const [session, setSession] = useState<ReturnType<typeof getSession>>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const themeConfig = getThemeConfig();
  const [logoUrl, setLogoUrl] = useState(themeConfig.logoUrl);
  const [siteName, setSiteName] = useState(themeConfig.siteName || 'gjej-pune.com');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [messagesDropdownOpen, setMessagesDropdownOpen] = useState(false);
  const [notificationsDropdownOpen, setNotificationsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const [mobileSearchLocation, setMobileSearchLocation] = useState('');
  const [msgItems, setMsgItems] = useState<{ id: string; logo: string; image: string | null; company: string; msg: string; time: string; unread: boolean }[]>([]);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [notifItems, setNotifItems] = useState<{ id: string; type: string; title: string; body: string; read: boolean; createdAt: string; meta?: string }[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [notifCursor, setNotifCursor] = useState<string | null>(null);
  const [notifLoading, setNotifLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const messagesMenuRef = useRef<HTMLDivElement>(null);
  const notificationsMenuRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    setSession(getSession());
    setSessionChecked(true);
  }, []);

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
          company: c.partnerName || '?',
          msg: c.lastMessage || '',
          time: new Date(c.lastAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
          unread: c.unreadCount > 0,
        })));
      }
      if (countRes.ok) setUnreadMsgCount(countRes.count);
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
    setNotificationsDropdownOpen(false);
    if (!n.read) {
      const token = getToken();
      if (token) {
        api.put(`/api/notifications/${n.id}/read`, {}, token).catch(() => {});
        setNotifItems(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
        setUnreadNotifCount(prev => Math.max(0, prev - 1));
      }
    }
    const role = session?.role || 'job-seeker';
    const base = role === 'employer' ? '/dashboard/employer' : '/dashboard/job-seeker';
    const hrefMap: Record<string, string> = {
      profile_view: `${base}/profile-views`,
      premium_activated: `${base}/settings`,
      boost_active: `${base}/settings`,
      premium_cancelled: `${base}/settings`,
      ad_online: role === 'employer' ? `${base}/jobs` : `${base}/my-ads`,
    };
    const href = hrefMap[n.type];
    if (href) router.push(href);
  };

  useEffect(() => {
    const refresh = () => loadMessages();
    window.addEventListener('messages:updated', refresh);
    return () => window.removeEventListener('messages:updated', refresh);
  }, [loadMessages]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onNewMsg = () => { console.log('[Header] message:new received'); loadMessages(); };
    const onSent = () => { console.log('[Header] message:sent received'); loadMessages(); };
    socket.on('message:new', onNewMsg);
    socket.on('message:sent', onSent);
    return () => { socket.off('message:new', onNewMsg); socket.off('message:sent', onSent); };
  }, [loadMessages]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const tcfg = getThemeConfig();
    setLogoUrl(tcfg.logoUrl);
    setSiteName(tcfg.siteName || 'gjej-pune.com');
    const handler = () => {
      const c = getThemeConfig();
      setLogoUrl(c.logoUrl);
      setSiteName(c.siteName || 'gjej-pune.com');
    };
    window.addEventListener(CONFIG_UPDATED_EVENT, handler);
    return () => window.removeEventListener(CONFIG_UPDATED_EVENT, handler);
  }, []);

  useEffect(() => {
    const handleFocus = () => setSession(getSession());
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (messagesMenuRef.current && !messagesMenuRef.current.contains(e.target as Node)) {
        setMessagesDropdownOpen(false);
      }
      if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(e.target as Node)) {
        setNotificationsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openMessages = () => {
    setMessagesDropdownOpen((o) => !o);
    setNotificationsDropdownOpen(false);
    setUserDropdownOpen(false);
  };
  const openNotifications = () => {
    setNotificationsDropdownOpen((o) => !o);
    setMessagesDropdownOpen(false);
    setUserDropdownOpen(false);
  };
  const openUserMenu = () => {
    setUserDropdownOpen((o) => !o);
    setMessagesDropdownOpen(false);
    setNotificationsDropdownOpen(false);
  };

  const handleSignOut = async () => {
    setUserDropdownOpen(false);
    setIsMenuOpen(false);
    await logout();
    window.location.href = `/${locale}/auth/login`;
  };

  const pathname = usePathname();
  const isJobSeeker = session?.role === 'job-seeker';
  const isEmployer = session?.role === 'employer';
  const isAdmin = session?.role === 'admin';
  const displayName = session ? getDisplayName(session) : '';
  const isPublicJobsActive = pathname === '/jobs' || pathname.startsWith('/jobs/');
  const isEmployerDashboardActive = pathname === '/dashboard/employer' || pathname === '/dashboard/employer/';
  const isEmployerJobsActive = pathname === '/dashboard/employer/jobs' || pathname.startsWith('/dashboard/employer/jobs/');

  const jsConfig = isJobSeeker ? getJobSeekerConfig() : null;
  const jobSeekerSectionLinks = jsConfig
    ? [
        { href: '/dashboard/job-seeker', key: 'overview' as const, show: true },
        { href: '/dashboard/job-seeker/my-ads', key: 'myAd' as const, show: true },
        { href: '/dashboard/job-seeker/applications', key: 'myApplications' as const, show: jsConfig.features.showApplications },
        { href: '/dashboard/job-seeker/saved', key: 'savedJobs' as const, show: jsConfig.features.showSavedJobs }
      ].filter((l) => l.show)
    : [];

  return (
    <header className={clsx(
      'w-full border-b z-50 lg:sticky lg:top-0 transition-all duration-300',
      isScrolled
        ? 'bg-white/80 backdrop-blur-xl border-slate-200/80 shadow-[0_1px_0_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.06)]'
        : 'bg-white border-slate-200 shadow-none'
    )}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Logo */}
          <div className="flex items-center min-w-0 shrink">
            <Link href="/" className="flex items-center group">
              <img
                src={logoUrl || '/logo.png'}
                alt={siteName}
                className="h-16 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>
          </div>

          {/* Right: Navigation & Actions */}
          <div className="hidden lg:flex items-center space-x-1 sm:space-x-2 xl:space-x-4">
            {!sessionChecked ? (
              /* Neutral placeholder while session loads — no login/register flash */
              <div className="flex items-center gap-3">
                <div className="w-20 h-3 bg-slate-100 rounded-full animate-pulse" />
                <div className="h-5 w-[1px] bg-slate-200" />
                <LanguageSwitcher />
                <div className="w-8 h-8 bg-slate-100 rounded-full animate-pulse" />
              </div>
            ) : session ? (
              <>
                {/* Logged-in: role-specific links */}
                {isJobSeeker && (
                  <nav className="flex items-center gap-1.5" aria-label="My career sections">
                    {jobSeekerSectionLinks.map(({ href, key }) => {
                      const isActive =
                        href === '/dashboard/job-seeker'
                          ? pathname === href
                          : pathname === href || pathname.startsWith(href + '/');
                      return (
                        <Link
                          key={href}
                          href={href}
                          className={clsx(
                            'px-3 py-2 rounded-md text-sm font-bold whitespace-nowrap transition-colors duration-150 ease-out underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#162C66]/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                            isActive
                              ? 'text-[#162C66] bg-slate-100 underline decoration-2 decoration-current'
                              : 'text-slate-600 hover:text-[#162C66] hover:bg-slate-50 hover:underline hover:decoration-2 hover:decoration-current'
                          )}
                        >
                          {navT(key)}
                        </Link>
                      );
                    })}
                  </nav>
                )}
                {isEmployer && (
                  <>
                    <Link
                      href="/dashboard/employer"
                      className={clsx(
                        'px-3 py-2 rounded-md text-sm font-bold text-[#162C66] hover:bg-slate-50 transition-colors duration-150 ease-out underline-offset-4 hover:underline hover:decoration-2 hover:decoration-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#162C66]/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                        isEmployerDashboardActive && 'underline decoration-2 decoration-current'
                      )}
                      aria-current={isEmployerDashboardActive ? 'page' : undefined}
                    >
                      {sidebarT('dashboard')}
                    </Link>
                    <Link
                      href="/dashboard/employer/jobs"
                      className={clsx(
                        'px-3 py-2 rounded-md text-sm font-bold text-[#162C66] hover:bg-slate-50 transition-colors duration-150 ease-out underline-offset-4 hover:underline hover:decoration-2 hover:decoration-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#162C66]/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                        isEmployerJobsActive && 'underline decoration-2 decoration-current'
                      )}
                      aria-current={isEmployerJobsActive ? 'page' : undefined}
                    >
                      {sidebarT('myJobs')}
                    </Link>
                    <Link
                      href="/dashboard/employer/jobs/new"
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-full text-sm font-bold bg-[#F5C400] text-[#162C66] hover:bg-[#ffe533] transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#162C66]/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    >
                      <Plus size={16} />
                      <span>{sidebarT('postJob')}</span>
                    </Link>
                  </>
                )}
                <div className="h-5 w-[1px] bg-slate-200 mx-1" />
                <LanguageSwitcher />
                {((isJobSeeker && jsConfig?.features.showMessages) || isEmployer) && (() => {
                  const messagesHref = isEmployer ? '/dashboard/employer/messages' : '/dashboard/job-seeker/messages';
                  const isMessagesActive = pathname.startsWith('/dashboard/job-seeker/messages') || pathname.startsWith('/dashboard/employer/messages');
                  return (
                  <div className="relative" ref={messagesMenuRef}>
                    <button
                      type="button"
                      onClick={openMessages}
                      className={clsx(
                        'relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#162C66]/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                        messagesDropdownOpen || isMessagesActive
                          ? 'text-[#162C66] bg-[#162C66]/[0.06]'
                          : 'text-slate-400 hover:text-[#162C66] hover:bg-slate-50'
                      )}
                      aria-label={navT('messages')}
                      aria-expanded={messagesDropdownOpen}
                      aria-haspopup="true"
                    >
                      <HiOutlineChatBubbleLeft className="w-[21px] h-[21px]" />
                      {unreadMsgCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" aria-hidden />}
                    </button>
                    {messagesDropdownOpen && (
                      <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-slate-100 shadow-xl z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-[#0B1F44]">{navT('messages')}</h3>
                          {unreadMsgCount > 0 && <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-full">{unreadMsgCount}</span>}
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                          {msgItems.length === 0 ? (
                            <div className="px-4 py-6 text-center">
                              <HiOutlineChatBubbleLeft className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                              <p className="text-[13px] text-slate-400">{navT('noMessages')}</p>
                            </div>
                          ) : (
                            msgItems.map((item, i) => (
                              <a
                                key={i}
                                href={`/${locale}${messagesHref}?conv=${item.id}`}
                                onMouseDown={(e) => { e.preventDefault(); window.location.href = `/${locale}${messagesHref}?conv=${item.id}`; }}
                                className={clsx('flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer', item.unread && 'bg-slate-50/50')}
                              >
                                {item.image ? (
                                  <img src={item.image.startsWith('/uploads/') ? `${API_URL}${item.image}` : item.image} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                                ) : (
                                  <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0', item.unread ? 'bg-[#162C66] text-white' : 'bg-slate-100 text-[#162C66]')}>
                                    {item.logo}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className={clsx('text-[13px] truncate', item.unread ? 'font-semibold text-[#0B1F44]' : 'font-medium text-slate-600')}>{item.company}</span>
                                    <span className="text-[10px] text-slate-400 shrink-0">{item.time}</span>
                                  </div>
                                  <p className="text-[12px] text-slate-400 truncate">{item.msg}</p>
                                </div>
                                {item.unread && <span className="w-2 h-2 bg-[#162C66] rounded-full shrink-0 mt-2" />}
                              </a>
                            ))
                          )}
                        </div>
                        <a
                          href={`/${locale}${messagesHref}`}
                          onMouseDown={(e) => { e.preventDefault(); window.location.href = `/${locale}${messagesHref}`; }}
                          className="block text-center py-2.5 text-[13px] font-semibold text-[#162C66] hover:bg-slate-50 border-t border-slate-100 transition-colors cursor-pointer"
                        >
                          {navT('messages')} →
                        </a>
                      </div>
                    )}
                  </div>
                  );
                })()}
                <div className="relative" ref={notificationsMenuRef}>
                  <button
                    type="button"
                    onClick={openNotifications}
                    className={clsx(
                      'relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#162C66]/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                      notificationsDropdownOpen
                        ? 'text-[#162C66] bg-[#162C66]/[0.06]'
                        : 'text-slate-400 hover:text-[#162C66] hover:bg-slate-50'
                    )}
                    aria-label={navT('notifications')}
                    aria-expanded={notificationsDropdownOpen}
                    aria-haspopup="true"
                  >
                    <HiOutlineBellAlert className="w-[21px] h-[21px]" />
                    {unreadNotifCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">{unreadNotifCount}</span>
                    )}
                  </button>
                  {notificationsDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-slate-100 shadow-xl z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-[#0B1F44]">{navT('notifications')}</h3>
                        {unreadNotifCount > 0 && (
                          <button onClick={markAllNotificationsRead} className="text-[11px] font-semibold text-[#162C66] hover:underline">{getMarkAllReadLabel(locale)}</button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto" onScroll={(e) => { const el = e.currentTarget; if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) loadMoreNotifications(); }}>
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
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={openUserMenu}
                    className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-slate-50 transition-colors duration-150 ease-out border border-transparent hover:border-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#162C66]/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    aria-expanded={userDropdownOpen}
                    aria-haspopup="true"
                    aria-label={navT('userMenuAria')}
                  >
                    {profileImage ? (
                      <img src={profileImage.startsWith('/uploads/') ? `${API_URL}${profileImage}` : profileImage} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 bg-[#162C66] rounded-full flex items-center justify-center text-white shrink-0">
                        <User size={16} />
                      </div>
                    )}
                    <ChevronDown
                      size={14}
                      className={clsx('text-slate-400 shrink-0 transition-transform duration-200 ease-out', userDropdownOpen && 'rotate-180')}
                    />
                  </button>
                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-slate-100 shadow-lg py-2 z-50"
                      role="menu"
                    >
                      <div className="px-4 py-2 border-b border-slate-100 mb-2">
                        <p className="text-sm font-bold text-[#162C66] truncate">{displayName}</p>
                        <p className="text-xs text-slate-500 capitalize">{session.role.replace('-', ' ')}</p>
                      </div>
                      {isJobSeeker && (
                        <>
                          <Link
                            href="/dashboard/job-seeker/profile"
                            role="menuitem"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-600 hover:text-[#162C66] hover:bg-slate-50"
                          >
                            <UserCircle size={16} />
                            {navT('myProfile')}
                          </Link>
                          <Link
                            href="/dashboard/job-seeker/settings"
                            role="menuitem"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-600 hover:text-[#162C66] hover:bg-slate-50"
                          >
                            <Settings size={16} />
                            {navT('myAccountSettings')}
                          </Link>
                        </>
                      )}
                      {isEmployer && (
                        <>
                          <Link
                            href="/dashboard/employer/settings"
                            role="menuitem"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-600 hover:text-[#162C66] hover:bg-slate-50"
                          >
                            <Settings size={16} />
                            {sidebarT('companyAndSettings')}
                          </Link>
                          <Link
                            href="/dashboard/employer/settings?tab=subscription"
                            role="menuitem"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-600 hover:text-[#162C66] hover:bg-slate-50"
                          >
                            <Crown size={16} />
                            {sidebarT('subscription')}
                          </Link>
                        </>
                      )}
                      {isAdmin && (
                        <Link
                          href="/admin"
                          role="menuitem"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-600 hover:text-[#162C66] hover:bg-slate-50"
                        >
                          <ShieldCheck size={16} />
                          Admin-Panel
                        </Link>
                      )}
                      <div className="border-t border-slate-100 my-2" />
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleSignOut();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-red-600 text-left"
                      >
                        <LogOut size={16} />
                        {sidebarT('signOut')}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-semibold text-[#162C66] hover:bg-slate-50 rounded-full transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#162C66]/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/auth/register"
                  className="px-5 py-2.5 rounded-full text-sm font-semibold bg-[#162C66] text-white hover:bg-[#1f3c8a] transition-colors duration-150 ease-out shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#162C66]/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  {t('signUp')}
                </Link>
                <div className="h-5 w-[1px] bg-slate-200 mx-2" />
                <LanguageSwitcher />
              </>
            )}
          </div>

          {/* Mobile */}
          <div className="lg:hidden flex items-center gap-0.5 shrink-0">
            <LanguageSwitcher />
            {!sessionChecked && (
              <div className="w-9 h-9 bg-slate-100 rounded-xl animate-pulse" />
            )}
            {sessionChecked && session && ((isJobSeeker && jsConfig?.features.showMessages) || isEmployer) && (() => {
              const mobileMessagesHref = isEmployer ? '/dashboard/employer/messages' : '/dashboard/job-seeker/messages';
              return (
              <div className="relative" ref={messagesMenuRef}>
                <button
                  type="button"
                  onClick={openMessages}
                  className={clsx(
                    'relative w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200',
                    messagesDropdownOpen || pathname.startsWith('/dashboard/job-seeker/messages') || pathname.startsWith('/dashboard/employer/messages')
                      ? 'text-[#162C66] bg-[#162C66]/[0.06]'
                      : 'text-slate-400 hover:text-[#162C66] hover:bg-slate-50'
                  )}
                  aria-label={navT('messages')}
                  aria-expanded={messagesDropdownOpen}
                  aria-haspopup="true"
                >
                  <HiOutlineChatBubbleLeft className="w-[19px] h-[19px]" />
                  {unreadMsgCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" aria-hidden />}
                </button>
                {messagesDropdownOpen && (
                  <div className="fixed top-16 left-4 right-4 bg-white rounded-xl border border-slate-100 shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-[#0B1F44]">{navT('messages')}</h3>
                      {unreadMsgCount > 0 && <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-full">{unreadMsgCount}</span>}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {msgItems.length === 0 ? (
                        <div className="px-4 py-6 text-center">
                          <HiOutlineChatBubbleLeft className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                          <p className="text-[13px] text-slate-400">{navT('noMessages')}</p>
                        </div>
                      ) : (
                        msgItems.map((item, i) => (
                          <a
                            key={i}
                            href={`/${locale}${mobileMessagesHref}?conv=${item.id}`}
                            onMouseDown={(e) => { e.preventDefault(); window.location.href = `/${locale}${mobileMessagesHref}?conv=${item.id}`; }}
                            className={clsx('flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer', item.unread && 'bg-slate-50/50')}
                          >
                            {item.image ? (
                              <img src={item.image.startsWith('/uploads/') ? `${API_URL}${item.image}` : item.image} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0', item.unread ? 'bg-[#162C66] text-white' : 'bg-slate-100 text-[#162C66]')}>
                                {item.logo}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className={clsx('text-[13px] truncate', item.unread ? 'font-semibold text-[#0B1F44]' : 'font-medium text-slate-600')}>{item.company}</span>
                                <span className="text-[10px] text-slate-400 shrink-0">{item.time}</span>
                              </div>
                              <p className="text-[12px] text-slate-400 truncate">{item.msg}</p>
                            </div>
                            {item.unread && <span className="w-2 h-2 bg-[#162C66] rounded-full shrink-0 mt-2" />}
                          </a>
                        ))
                      )}
                    </div>
                    <a
                      href={`/${locale}${mobileMessagesHref}`}
                      onMouseDown={(e) => { e.preventDefault(); window.location.href = `/${locale}${mobileMessagesHref}`; }}
                      className="block text-center py-2.5 text-[13px] font-semibold text-[#162C66] hover:bg-slate-50 border-t border-slate-100 transition-colors cursor-pointer"
                    >
                      {navT('messages')} →
                    </a>
                  </div>
                )}
              </div>
              );
            })()}
            {sessionChecked && session && (
              <div className="relative" ref={notificationsMenuRef}>
                <button
                  type="button"
                  onClick={openNotifications}
                  className={clsx(
                    'relative w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200',
                    notificationsDropdownOpen
                      ? 'text-[#162C66] bg-[#162C66]/[0.06]'
                      : 'text-slate-400 hover:text-[#162C66] hover:bg-slate-50'
                  )}
                  aria-label={navT('notifications')}
                  aria-expanded={notificationsDropdownOpen}
                  aria-haspopup="true"
                >
                  <HiOutlineBellAlert className="w-[19px] h-[19px]" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">{unreadNotifCount}</span>
                  )}
                </button>
                {notificationsDropdownOpen && (
                  <div className="fixed top-16 left-4 right-4 bg-white rounded-xl border border-slate-100 shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-[#0B1F44]">{navT('notifications')}</h3>
                      {unreadNotifCount > 0 && (
                        <button onClick={markAllNotificationsRead} className="text-[11px] font-semibold text-[#162C66] hover:underline">{getMarkAllReadLabel(locale)}</button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto" onScroll={(e) => { const el = e.currentTarget; if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) loadMoreNotifications(); }}>
                      {notifItems.length === 0 ? (
                        <div className="px-4 py-6 text-center">
                          <HiOutlineBellAlert className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                          <p className="text-[13px] text-slate-400">{navT('noNotifications')}</p>
                        </div>
                      ) : (
                        notifItems.map((n) => (
                          <div key={n.id} role="button" tabIndex={0} onMouseDown={() => { setIsMenuOpen(false); handleNotificationClick(n); }} onKeyDown={(e) => e.key === 'Enter' && handleNotificationClick(n)} className={clsx('block px-4 py-3 border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50 cursor-pointer', !n.read && 'bg-blue-50/40')}>
                            <div className="flex items-start gap-3">
                              <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5', n.type === 'premium_activated' ? 'bg-yellow-100' : n.type === 'boost_active' ? 'bg-purple-100' : n.type === 'profile_view' ? 'bg-blue-100' : n.type === 'ad_online' ? 'bg-green-100' : n.type === 'premium_cancelled' ? 'bg-red-100' : 'bg-slate-100')}>
                                {n.type === 'premium_activated' && <CheckCircle2 size={13} className="text-yellow-600" />}
                                {n.type === 'boost_active' && <Zap size={13} className="text-purple-600" />}
                                {n.type === 'profile_view' && <Eye size={13} className="text-blue-600" />}
                                {n.type === 'ad_online' && <Megaphone size={13} className="text-green-600" />}
                                {n.type === 'premium_cancelled' && <XCircle size={13} className="text-red-500" />}
                                {!['premium_activated', 'boost_active', 'profile_view', 'ad_online', 'premium_cancelled'].includes(n.type) && <Mail size={13} className="text-slate-500" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[12px] font-semibold text-[#0B1F44] truncate">{getNotifTitle(n, locale)}</p>
                                <p className="text-[11px] text-slate-500 line-clamp-2">{getNotifBody(n, locale)}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{new Date(n.createdAt).toLocaleString(locale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                              {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />}
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
            )}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-9 h-9 flex items-center justify-center rounded-xl text-[#162C66] hover:bg-slate-50 transition-all duration-200" aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}>
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 py-5 px-5 space-y-4 shadow-2xl fixed top-16 left-0 w-full z-40 overflow-y-auto max-h-[calc(100dvh-4rem)]">
          {/* User greeting */}
          {session && (
            <div className="flex items-center gap-3 px-1 pb-4 border-b border-slate-100">
              {profileImage ? (
                <img src={profileImage.startsWith('/uploads/') ? `${API_URL}${profileImage}` : profileImage} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-11 h-11 bg-[#162C66] rounded-full flex items-center justify-center text-white shrink-0">
                  <User size={20} />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-[#162C66] truncate">{displayName}</p>
                <p className="text-[12px] text-slate-400 capitalize">{session.role.replace('-', ' ')}</p>
              </div>
            </div>
          )}

          {/* Dashboard nav links (logged in) */}
          {isJobSeeker && (
            <nav className="flex flex-col space-y-0.5 bg-slate-50/60 rounded-2xl p-2">
              {jobSeekerSectionLinks.map(({ href, key }) => {
                const iconMap: Record<string, React.ReactNode> = {
                  overview: <LayoutDashboard size={18} />,
                  myAd: <Plus size={18} />,
                  myApplications: <Briefcase size={18} />,
                  savedJobs: <Bookmark size={18} />
                };
                return (
                  <Link key={href} href={href} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-semibold text-slate-700 hover:bg-white hover:text-[#162C66] hover:shadow-sm transition-all">
                    <span className="text-slate-400">{iconMap[key] || <ChevronRight size={18} />}</span>
                    <span className="flex-1">{navT(key)}</span>
                    <ChevronRight size={16} className="text-slate-300" />
                  </Link>
                );
              })}
              {jsConfig?.features.showMessages && (
                <Link href="/dashboard/job-seeker/messages" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-semibold text-slate-700 hover:bg-white hover:text-[#162C66] hover:shadow-sm transition-all">
                  <span className="relative text-slate-400">
                    <HiOutlineChatBubbleLeft className="w-[18px] h-[18px]" />
                    {unreadMsgCount > 0 && <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-rose-500 rounded-full" />}
                  </span>
                  <span className="flex-1">{navT('messages')}</span>
                  {unreadMsgCount > 0 && <span className="text-[11px] font-bold text-white bg-rose-500 px-1.5 py-0.5 rounded-full">{unreadMsgCount}</span>}
                  <ChevronRight size={16} className="text-slate-300" />
                </Link>
              )}
              <Link href="/dashboard/job-seeker/profile-views" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-semibold text-slate-700 hover:bg-white hover:text-[#162C66] hover:shadow-sm transition-all">
                <span className="text-slate-400"><Eye size={18} /></span>
                <span className="flex-1">{navT('profileVisitors')}</span>
                <ChevronRight size={16} className="text-slate-300" />
              </Link>
            </nav>
          )}

          {isEmployer && (
            <nav className="flex flex-col space-y-0.5 bg-slate-50/60 rounded-2xl p-2">
              <Link href="/dashboard/employer" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-semibold text-slate-700 hover:bg-white hover:text-[#162C66] hover:shadow-sm transition-all">
                <span className="text-slate-400"><LayoutDashboard size={18} /></span>
                <span className="flex-1">{sidebarT('dashboard')}</span>
                <ChevronRight size={16} className="text-slate-300" />
              </Link>
              <Link href="/dashboard/employer/jobs" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-semibold text-slate-700 hover:bg-white hover:text-[#162C66] hover:shadow-sm transition-all">
                <span className="text-slate-400"><Briefcase size={18} /></span>
                <span className="flex-1">{sidebarT('myJobs')}</span>
                <ChevronRight size={16} className="text-slate-300" />
              </Link>
              <Link href="/dashboard/employer/jobs/new" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-semibold text-slate-700 hover:bg-white hover:text-[#162C66] hover:shadow-sm transition-all">
                <span className="text-slate-400"><Plus size={18} /></span>
                <span className="flex-1">{sidebarT('postJob')}</span>
                <ChevronRight size={16} className="text-slate-300" />
              </Link>
              <Link href="/dashboard/employer/messages" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-semibold text-slate-700 hover:bg-white hover:text-[#162C66] hover:shadow-sm transition-all">
                <span className="relative text-slate-400">
                  <HiOutlineChatBubbleLeft className="w-[18px] h-[18px]" />
                  {unreadMsgCount > 0 && <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-rose-500 rounded-full" />}
                </span>
                <span className="flex-1">{navT('messages')}</span>
                {unreadMsgCount > 0 && <span className="text-[11px] font-bold text-white bg-rose-500 px-1.5 py-0.5 rounded-full">{unreadMsgCount}</span>}
                <ChevronRight size={16} className="text-slate-300" />
              </Link>
              <Link href="/dashboard/employer/profile-views" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-semibold text-slate-700 hover:bg-white hover:text-[#162C66] hover:shadow-sm transition-all">
                <span className="text-slate-400"><Eye size={18} /></span>
                <span className="flex-1">{navT('profileVisitors')}</span>
                <ChevronRight size={16} className="text-slate-300" />
              </Link>
            </nav>
          )}

          {/* Profile & Settings (logged in) */}
          {session && (
            <div className="border-t border-slate-100 pt-3 flex flex-col space-y-0.5">
              {isJobSeeker && jsConfig?.features.showProfile && (
                <Link href="/dashboard/job-seeker/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#162C66] transition-colors">
                  <UserCircle size={18} className="text-slate-400" />
                  <span>{navT('myProfile')}</span>
                </Link>
              )}
              {isJobSeeker && (
                <Link href="/dashboard/job-seeker/settings" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#162C66] transition-colors">
                  <Settings size={18} className="text-slate-400" />
                  <span>{navT('myAccountSettings')}</span>
                </Link>
              )}
              {isEmployer && (
                <>
                  <Link href="/dashboard/employer/settings" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#162C66] transition-colors">
                    <Settings size={18} className="text-slate-400" />
                    <span>{sidebarT('companyAndSettings')}</span>
                  </Link>
                  <Link href="/dashboard/employer/settings?tab=subscription" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#162C66] transition-colors">
                    <Crown size={18} className="text-slate-400" />
                    <span>{sidebarT('subscription')}</span>
                  </Link>
                </>
              )}
              <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#162C66] transition-colors">
                <HelpCircle size={18} className="text-slate-400" />
                <span>{t('helpCenter')}</span>
              </Link>
            </div>
          )}

          {/* Help for non-logged-in */}
          {!session && (
            <div className="flex flex-col space-y-1">
              <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#162C66] transition-colors">
                <HelpCircle size={18} className="text-slate-400" />
                <span>{t('helpCenter')}</span>
              </Link>
            </div>
          )}

          {/* Action buttons */}
          <div className="border-t border-slate-100 pt-4 flex flex-col space-y-3">
            <Link href={session ? "/jobs" : "/auth/login"} onClick={() => setIsMenuOpen(false)} className="w-full bg-[#162C66] text-white py-3.5 rounded-xl font-semibold text-center text-[15px] shadow-sm flex items-center justify-center space-x-2">
              <span>{t('findJob')}</span>
              <ChevronRight size={18} />
            </Link>
            {session ? (
              <button
                type="button"
                onClick={() => { setIsMenuOpen(false); handleSignOut(); }}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[15px] font-semibold text-slate-500 bg-slate-50 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={18} />
                <span>{sidebarT('signOut')}</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link href="/auth/login" onClick={() => setIsMenuOpen(false)} className="w-full bg-slate-50 text-[#162C66] py-3.5 rounded-xl font-semibold text-center text-[15px]">
                  {t('login')}
                </Link>
                <Link href="/auth/register" onClick={() => setIsMenuOpen(false)} className="w-full bg-slate-50 text-[#162C66] py-3.5 rounded-xl font-semibold text-center text-[15px]">
                  {t('signUp')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-white border-b border-slate-200 shadow-lg p-4" ref={mobileSearchRef}>
          <div className="space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={mobileSearchQuery}
                onChange={(e) => setMobileSearchQuery(e.target.value)}
                placeholder={t('findJob')}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#162C66]/10 focus:border-[#162C66]/30 outline-none transition-all"
                autoFocus
              />
            </div>
            <LocationAutocomplete
              value={mobileSearchLocation}
              onChange={setMobileSearchLocation}
              placeholder={locale === 'de' ? 'Stadt oder Region' : locale === 'fr' ? 'Ville ou région' : locale === 'it' ? 'Città o regione' : locale === 'sq' ? 'Qyteti ose rajoni' : 'City or State'}
              iconSize={16}
              iconClassName="text-slate-400 left-3.5"
              inputClassName="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#162C66]/10 focus:border-[#162C66]/30 outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams();
                if (mobileSearchQuery) params.set('keyword', mobileSearchQuery);
                if (mobileSearchLocation) params.set('location', mobileSearchLocation);
                const url = `/jobs${params.toString() ? '?' + params.toString() : ''}`;
                router.push(url);
                setMobileSearchOpen(false);
                setMobileSearchQuery('');
                setMobileSearchLocation('');
              }}
              className="w-full bg-[#F5C400] text-[#162C66] py-3 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-[#ffe533] transition-colors shadow-sm"
            >
              <Search size={18} strokeWidth={2.5} />
              {locale === 'de' ? 'Jetzt suchen' : locale === 'fr' ? 'Rechercher' : locale === 'it' ? 'Cerca ora' : locale === 'sq' ? 'Kërko tani' : 'Search now'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
