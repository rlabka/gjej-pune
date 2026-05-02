'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { Search, Trash2, Crown, User, Briefcase, FileEdit, Loader2, Pencil, KeyRound, X, Check, Users, ChevronLeft, ChevronRight, Shield, Mail, Phone, Building2, Hash, Calendar, Globe, Camera } from 'lucide-react';
import { clsx } from 'clsx';
import PhoneInput from '@/components/PhoneInput';

const LIMIT = 20;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface UserRow {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  isPremium: boolean;
  phone: string | null;
  companyName: string | null;
  location: string | null;
  image: string | null;
  locale: string | null;
  createdAt: string;
  _count: { jobs: number; jobSeekerAds: number };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Heute';
  if (days === 1) return 'Gestern';
  if (days < 30) return `vor ${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `vor ${months}M`;
  return `vor ${Math.floor(months / 12)}J`;
}

export default function AdminUsersPage() {
  const t = useTranslations('Admin');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [premiumFilter, setPremiumFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Edit modal
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({ displayName: '', email: '', phone: '', companyName: '', role: '', locale: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  // Password reset modal
  const [pwUser, setPwUser] = useState<UserRow | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);

  const fetchUsers = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const qp = new URLSearchParams();
      qp.set('page', String(page));
      qp.set('limit', String(LIMIT));
      if (search.trim()) qp.set('search', search.trim());
      if (roleFilter) qp.set('role', roleFilter);
      if (premiumFilter) qp.set('premium', 'true');
      const res = await api.get<{ ok: boolean; users: UserRow[]; total: number; totalPages: number }>(`/api/admin/all-users?${qp}`, token);
      if (res.ok) {
        setUsers(res.users);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      }
    } catch {}
    setLoading(false);
  }, [page, search, roleFilter, premiumFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t('usersPage.confirmDelete', { name }))) return;
    const token = getToken();
    if (!token) return;
    setDeleting(id);
    try {
      const res = await api.delete<{ ok: boolean }>(`/api/admin/all-users/${id}`, token);
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== id));
        setTotal(prev => prev - 1);
      }
    } catch {}
    setDeleting(null);
  };

  const togglePremium = async (id: string, current: boolean) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await api.patch<{ ok: boolean; user: UserRow }>(`/api/admin/all-users/${id}`, { isPremium: !current }, token);
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, isPremium: !current } : u));
      }
    } catch {};
  };

  const openEdit = (u: UserRow) => {
    setEditUser(u);
    setEditForm({ displayName: u.displayName || '', email: u.email, phone: u.phone || '', companyName: u.companyName || '', role: u.role, locale: u.locale || 'de' });
  };

  const handleImageUpload = async (file: File) => {
    if (!editUser) return;
    const token = getToken();
    if (!token) return;
    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.upload<{ ok: boolean; image: string }>(`/api/admin/all-users/${editUser.id}/upload-image`, fd, token);
      if (res.ok) {
        const updatedUser = { ...editUser, image: res.image };
        setEditUser(updatedUser);
        setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, image: res.image } : u));
      }
    } catch {}
    setImageUploading(false);
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    const token = getToken();
    if (!token) return;
    setEditSaving(true);
    try {
      const res = await api.patch<{ ok: boolean; user: any }>(`/api/admin/all-users/${editUser.id}`, editForm, token);
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...editForm } : u));
        setEditUser(null);
      }
    } catch {}
    setEditSaving(false);
  };

  const handlePasswordReset = async () => {
    if (!pwUser || newPassword.length < 6) return;
    const token = getToken();
    if (!token) return;
    setPwSaving(true);
    try {
      const res = await api.post<{ ok: boolean }>(`/api/admin/all-users/${pwUser.id}/reset-password`, { newPassword }, token);
      if (res.ok) {
        setPwSuccess(true);
        setTimeout(() => { setPwUser(null); setPwSuccess(false); setNewPassword(''); }, 1500);
      }
    } catch {}
    setPwSaving(false);
  };

  const stats = {
    total,
    employers: users.filter(u => u.role === 'employer').length,
    seekers: users.filter(u => u.role === 'job-seeker').length,
    premium: users.filter(u => u.isPremium).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-[#162C66] flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-black text-[#0B1F44] tracking-tight">{t('usersPage.title')}</h1>
            <p className="text-[13px] text-slate-400 font-medium">{t('usersPage.subtitle', { count: total })}</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              <Users size={15} className="text-slate-400" />
            </div>
            <div>
              <p className="text-[22px] font-black text-[#0B1F44] leading-none tabular-nums">{stats.total}</p>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Gesamt</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Briefcase size={15} className="text-blue-500" />
            </div>
            <div>
              <p className="text-[22px] font-black text-[#0B1F44] leading-none tabular-nums">{stats.employers}</p>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{t('usersPage.roleEmployer')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <FileEdit size={15} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-[22px] font-black text-[#0B1F44] leading-none tabular-nums">{stats.seekers}</p>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{t('usersPage.roleJobSeeker')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
              <Crown size={15} className="text-amber-500" />
            </div>
            <div>
              <p className="text-[22px] font-black text-[#0B1F44] leading-none tabular-nums">{stats.premium}</p>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Premium</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('usersPage.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-lg text-[13px] font-medium text-[#0B1F44] placeholder:text-slate-300 focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            {(['', 'employer', 'job-seeker'] as const).map((role) => (
              <button
                key={role}
                onClick={() => { setRoleFilter(role); setPage(1); }}
                className={clsx(
                  'flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-[12px] font-bold transition-all whitespace-nowrap',
                  roleFilter === role
                    ? 'bg-[#162C66] text-white shadow-sm'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200/60'
                )}
              >
                {role === '' && <Users size={13} />}
                {role === 'employer' && <Briefcase size={13} />}
                {role === 'job-seeker' && <FileEdit size={13} />}
                {role === '' ? t('usersPage.allRoles') : role === 'employer' ? t('usersPage.roleEmployer') : t('usersPage.roleJobSeeker')}
              </button>
            ))}
            <button
              onClick={() => { setPremiumFilter(p => !p); setPage(1); }}
              className={clsx(
                'flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-[12px] font-bold transition-all whitespace-nowrap',
                premiumFilter
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200/60'
              )}
            >
              <Crown size={13} />
              Premium
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-7 h-7 animate-spin text-[#162C66] mb-3" />
            <p className="text-[13px] text-slate-400 font-medium">Lade Benutzer...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users size={24} className="text-slate-300" />
            </div>
            <p className="font-bold text-[#0B1F44] text-[15px] mb-1">{t('usersPage.noUsers')}</p>
            <p className="text-[13px] text-slate-400">Versuchen Sie andere Filteroptionen</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/40">
                    <th className="text-left px-5 py-3">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.08em]">{t('usersPage.colUser')}</span>
                    </th>
                    <th className="text-left px-4 py-3">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.08em]">{t('usersPage.colRole')}</span>
                    </th>
                    <th className="text-center px-4 py-3 w-20">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.08em]">{t('usersPage.colAds')}</span>
                    </th>
                    <th className="text-left px-4 py-3 w-28">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.08em]">{t('usersPage.colRegistered')}</span>
                    </th>
                    <th className="text-center px-4 py-3 w-20">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.08em]">Premium</span>
                    </th>
                    <th className="text-right px-5 py-3 w-36">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.08em]">{t('usersPage.colActions')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, idx) => (
                    <tr key={u.id} className={clsx(
                      'group transition-colors hover:bg-slate-50/60',
                      idx < users.length - 1 && 'border-b border-slate-100/60',
                      u.isPremium && 'bg-amber-50/20'
                    )}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {u.image ? (
                            <img src={u.image.startsWith('/uploads/') ? `${API_URL}${u.image}` : u.image} alt="" className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0" />
                          ) : (
                            <div className={clsx(
                              'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all',
                              u.isPremium
                                ? 'bg-amber-50 border-amber-200 text-amber-600'
                                : 'bg-slate-50 border-slate-100 text-slate-400 group-hover:bg-[#162C66]/[0.04] group-hover:border-[#162C66]/10 group-hover:text-[#162C66]'
                            )}>
                              {u.isPremium ? <Crown size={15} /> : <User size={15} />}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-[13px] font-bold text-[#0B1F44] truncate group-hover:text-[#162C66] transition-colors">{u.displayName || '—'}</p>
                              {u.isPremium && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 text-[10px] font-black rounded-md uppercase tracking-wide border border-amber-200/60">
                                  PRO
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={clsx(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border',
                          u.role === 'employer'
                            ? 'bg-blue-50 text-blue-600 border-blue-100'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        )}>
                          {u.role === 'employer' ? <Briefcase size={11} /> : <FileEdit size={11} />}
                          {u.role === 'employer' ? t('usersPage.roleEmployer') : t('usersPage.roleJobSeeker')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 border border-slate-100/80">
                          <Hash size={10} className="text-slate-400" />
                          <span className="text-[12px] font-bold text-[#0B1F44] tabular-nums">{u.role === 'employer' ? u._count.jobs : u._count.jobSeekerAds}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-[12px] font-semibold text-slate-500">{formatDate(u.createdAt)}</span>
                          <span className="text-[10px] text-slate-400">{timeAgo(u.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => togglePremium(u.id, u.isPremium)}
                          className={clsx(
                            'w-8 h-8 rounded-xl flex items-center justify-center transition-all border',
                            u.isPremium
                              ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200/50 hover:from-amber-500 hover:to-amber-600'
                              : 'bg-slate-50 text-slate-300 border-slate-200/60 hover:bg-slate-100 hover:text-slate-400'
                          )}
                          title={u.isPremium ? t('usersPage.premiumOff') : t('usersPage.premiumOn')}
                        >
                          <Crown size={13} />
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 justify-end opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(u)}
                            className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-all border border-transparent hover:border-blue-100"
                            title={t('usersPage.edit')}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => { setPwUser(u); setNewPassword(''); setPwSuccess(false); }}
                            className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-600 flex items-center justify-center transition-all border border-transparent hover:border-amber-100"
                            title={t('usersPage.resetPassword')}
                          >
                            <KeyRound size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(u.id, u.displayName || u.email)}
                            disabled={deleting === u.id}
                            className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all border border-transparent hover:border-red-100 disabled:opacity-50"
                            title={t('usersPage.delete')}
                          >
                            {deleting === u.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card layout */}
            <div className="lg:hidden divide-y divide-slate-100">
              {users.map((u) => (
                <div key={u.id} className={clsx('p-4', u.isPremium && 'bg-amber-50/20')}>
                  <div className="flex items-start gap-3">
                    {u.image ? (
                      <img src={u.image.startsWith('/uploads/') ? `${API_URL}${u.image}` : u.image} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0" />
                    ) : (
                      <div className={clsx(
                        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border',
                        u.isPremium
                          ? 'bg-amber-50 border-amber-200 text-amber-600'
                          : 'bg-slate-50 border-slate-100 text-slate-400'
                      )}>
                        {u.isPremium ? <Crown size={16} /> : <User size={16} />}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[14px] font-bold text-[#0B1F44] truncate">{u.displayName || '—'}</p>
                        {u.isPremium && (
                          <span className="inline-flex items-center px-1.5 py-0.5 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 text-[10px] font-black rounded-md uppercase border border-amber-200/60">
                            PRO
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-slate-400 truncate mb-2">{u.email}</p>

                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <span className={clsx(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border',
                          u.role === 'employer'
                            ? 'bg-blue-50 text-blue-600 border-blue-100'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        )}>
                          {u.role === 'employer' ? <Briefcase size={10} /> : <FileEdit size={10} />}
                          {u.role === 'employer' ? t('usersPage.roleEmployer') : t('usersPage.roleJobSeeker')}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 text-[11px] font-semibold text-slate-500 border border-slate-100">
                          <Hash size={9} />
                          {u.role === 'employer' ? u._count.jobs : u._count.jobSeekerAds} Inserate
                        </span>
                        <span className="text-[11px] text-slate-400">{formatDate(u.createdAt)}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => togglePremium(u.id, u.isPremium)}
                          className={clsx(
                            'w-8 h-8 rounded-lg flex items-center justify-center transition-all border',
                            u.isPremium
                              ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-white border-amber-500 shadow-sm'
                              : 'bg-slate-50 text-slate-300 border-slate-200/60'
                          )}
                        >
                          <Crown size={13} />
                        </button>
                        <button onClick={() => openEdit(u)} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-all border border-transparent"><Pencil size={13} /></button>
                        <button onClick={() => { setPwUser(u); setNewPassword(''); setPwSuccess(false); }} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-600 flex items-center justify-center transition-all border border-transparent"><KeyRound size={13} /></button>
                        <button onClick={() => handleDelete(u.id, u.displayName || u.email)} disabled={deleting === u.id} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all border border-transparent disabled:opacity-50">
                          {deleting === u.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/30">
            <p className="text-[11px] text-slate-400 font-semibold tabular-nums">
              {t('usersPage.pageInfo', { page, totalPages, total })}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200/60 bg-white text-slate-400 hover:text-[#162C66] hover:border-[#162C66]/20 disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page + i - 2;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={clsx(
                      'w-8 h-8 flex items-center justify-center rounded-lg text-[12px] font-bold transition-all',
                      p === page
                        ? 'bg-[#162C66] text-white shadow-sm'
                        : 'text-slate-400 hover:bg-slate-100'
                    )}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200/60 bg-white text-slate-400 hover:text-[#162C66] hover:border-[#162C66]/20 disabled:opacity-30 transition-all"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setEditUser(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className={clsx(
              'px-6 py-5 shrink-0 bg-gradient-to-r',
              editForm.role === 'employer' ? 'from-[#162C66] to-[#1a3577]' : 'from-emerald-600 to-emerald-700'
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {editUser.image ? (
                    <img src={editUser.image.startsWith('/uploads/') ? `${API_URL}${editUser.image}` : editUser.image} alt="" className="w-10 h-10 rounded-xl object-cover border-2 border-white/20" />
                  ) : (
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                      {editForm.role === 'employer' ? <Briefcase size={18} className="text-white" /> : <User size={18} className="text-white" />}
                    </div>
                  )}
                  <div>
                    <h3 className="text-[16px] font-black text-white">{t('usersPage.editTitle')}</h3>
                    <p className="text-[12px] text-white/50">{editUser.email}</p>
                  </div>
                </div>
                <button onClick={() => setEditUser(null)} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"><X size={16} /></button>
              </div>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Profile image upload */}
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                <div className="relative group">
                  {editUser.image ? (
                    <img src={editUser.image.startsWith('/uploads/') ? `${API_URL}${editUser.image}` : editUser.image} alt="" className="w-16 h-16 rounded-xl object-cover border-2 border-slate-200 shadow-sm" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center">
                      <User size={24} className="text-slate-300" />
                    </div>
                  )}
                  <label className={clsx(
                    'absolute inset-0 rounded-xl flex items-center justify-center cursor-pointer transition-all',
                    'bg-black/0 group-hover:bg-black/40'
                  )}>
                    {imageUploading ? (
                      <Loader2 size={18} className="text-white animate-spin" />
                    ) : (
                      <Camera size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); }} />
                  </label>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#0B1F44]">{editUser.displayName || '—'}</p>
                  <p className="text-[11px] text-slate-400">Registriert {formatDate(editUser.createdAt)}</p>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  <Shield size={11} />{t('usersPage.colRole')}
                </label>
                <div className="flex gap-2">
                  {(['job-seeker', 'employer'] as const).map((role) => (
                    <button
                      key={role}
                      onClick={() => setEditForm(p => ({ ...p, role }))}
                      className={clsx(
                        'flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-[11px] font-bold transition-all border',
                        editForm.role === role
                          ? editForm.role === 'employer' ? 'bg-[#162C66] text-white border-[#162C66] shadow-sm shadow-blue-200' : 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200/60 hover:bg-slate-100'
                      )}
                    >
                      {role === 'employer' ? <Briefcase size={11} /> : <FileEdit size={11} />}
                      {role === 'employer' ? t('usersPage.roleEmployer') : t('usersPage.roleJobSeeker')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Locale */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  <Globe size={11} />Sprache
                </label>
                <div className="flex gap-1.5">
                  {(['de', 'en', 'fr', 'it', 'sq'] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setEditForm(p => ({ ...p, locale: l }))}
                      className={clsx(
                        'flex-1 px-2 py-2.5 rounded-lg text-[11px] font-bold transition-all border uppercase',
                        editForm.locale === l
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200/60 hover:bg-slate-100'
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name + Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    <User size={11} />{t('usersPage.fieldName')}
                  </label>
                  <input type="text" value={editForm.displayName} onChange={e => setEditForm(p => ({ ...p, displayName: e.target.value }))} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/60 rounded-lg text-[13px] font-medium text-[#0B1F44] focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none transition-all" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    <Mail size={11} />E-Mail
                  </label>
                  <input type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/60 rounded-lg text-[13px] font-medium text-[#0B1F44] focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none transition-all" />
                </div>
              </div>

              {/* Phone */}
              <div onClick={(e) => {
                const el = e.currentTarget;
                setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
              }}>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  <Phone size={11} />{t('usersPage.fieldPhone')}
                </label>
                <PhoneInput
                  value={editForm.phone}
                  onChange={(val) => setEditForm(p => ({ ...p, phone: val }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/60 rounded-lg text-[13px] font-medium text-[#0B1F44] focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                />
              </div>

              {/* Employer-only: Company Name */}
              {editForm.role === 'employer' && (
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    <Building2 size={11} />{t('usersPage.fieldCompanyName')}
                  </label>
                  <input type="text" value={editForm.companyName} onChange={e => setEditForm(p => ({ ...p, companyName: e.target.value }))} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/60 rounded-lg text-[13px] font-medium text-[#0B1F44] focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none transition-all" />
                </div>
              )}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100 shrink-0 bg-white">
              <button onClick={() => setEditUser(null)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all">{t('usersPage.cancel')}</button>
              <button onClick={handleEditSave} disabled={editSaving} className={clsx(
                'flex-1 px-4 py-2.5 text-white rounded-lg text-[13px] font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-sm',
                editForm.role === 'employer' ? 'bg-[#162C66] hover:bg-[#1a3577]' : 'bg-emerald-600 hover:bg-emerald-700'
              )}>
                {editSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {t('usersPage.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {pwUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setPwUser(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                    <KeyRound size={16} className="text-white" />
                  </div>
                  <h3 className="text-[16px] font-black text-white">{t('usersPage.resetPasswordTitle')}</h3>
                </div>
                <button onClick={() => setPwUser(null)} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"><X size={16} /></button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-[13px] text-slate-500 mb-4">{t('usersPage.resetPasswordFor', { name: pwUser.displayName || pwUser.email })}</p>
              {pwSuccess ? (
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-[13px] py-6 justify-center">
                  <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Check size={16} />
                  </div>
                  {t('usersPage.resetPasswordSuccess')}
                </div>
              ) : (
                <>
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      <KeyRound size={11} />{t('usersPage.newPassword')}
                    </label>
                    <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder={t('usersPage.newPasswordPlaceholder')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-lg text-[13px] font-medium text-[#0B1F44] focus:bg-white focus:border-amber-300 focus:ring-2 focus:ring-amber-100 outline-none transition-all" />
                    {newPassword.length > 0 && newPassword.length < 6 && (
                      <p className="text-[11px] text-red-500 font-medium mt-1.5">{t('usersPage.passwordMinLength')}</p>
                    )}
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setPwUser(null)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-500 hover:bg-slate-50 transition-all">{t('usersPage.cancel')}</button>
                    <button onClick={handlePasswordReset} disabled={pwSaving || newPassword.length < 6} className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-lg text-[13px] font-bold hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-sm">
                      {pwSaving ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                      {t('usersPage.resetPasswordBtn')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
