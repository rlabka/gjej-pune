'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { Link } from '@/i18n/routing';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import {
  getEmployers,
  updateEmployerStatus,
  banEmployer,
  deleteEmployer,
  type EmployerWithCompany,
  type EmployerStatus
} from '@/data/mockAdminEmployers';
import { Search, Eye, PauseCircle, PlayCircle, Ban, Trash2, Building2, MoreVertical } from 'lucide-react';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }: { status: EmployerStatus }) {
  const t = useTranslations('Admin.employersPage');
  const variant = status === 'active' ? 'success' : status === 'suspended' ? 'warning' : 'error';
  const label = status === 'active' ? t('statusActive') : status === 'suspended' ? t('statusSuspended') : t('statusBanned');
  return <Badge variant={variant}>{label}</Badge>;
}

function EmployerActions({
  row,
  onView,
  onSuspendReactivate,
  onBan,
  onDelete,
  t
}: {
  row: EmployerWithCompany;
  onView: (id: string) => void;
  onSuspendReactivate: (id: string, status: 'active' | 'suspended') => void;
  onBan: (id: string, name: string) => void;
  onDelete: (id: string, name: string) => void;
  t: (key: string) => string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex items-center gap-2 flex-wrap">
      <Button variant="ghost" size="sm" onClick={() => onView(row.id)} className="!p-2" title={t('view')}>
        <Eye size={18} />
      </Button>
      {row.status !== 'banned' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSuspendReactivate(row.id, row.status === 'suspended' ? 'active' : 'suspended')}
          className="!p-2"
          title={row.status === 'suspended' ? t('reactivate') : t('suspend')}
        >
          {row.status === 'suspended' ? <PlayCircle size={18} /> : <PauseCircle size={18} />}
        </Button>
      )}
      {row.status !== 'banned' && (
        <Button variant="ghost" size="sm" onClick={() => onBan(row.id, row.name)} className="!p-2 text-amber-600 hover:text-amber-700" title={t('ban')}>
          <Ban size={18} />
        </Button>
      )}
      <Link href={`/admin/companies/${row.companyId}`} className="!p-2 rounded-lg text-slate-600 hover:bg-slate-100 inline-flex" title={t('goToCompany')}>
        <Building2 size={18} />
      </Link>
      <div className="relative">
        <Button variant="ghost" size="sm" onClick={() => setOpen(!open)} className="!p-2" aria-expanded={open} aria-haspopup="true">
          <MoreVertical size={18} />
        </Button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" aria-hidden onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-1 z-20 w-48 py-1 bg-white rounded-xl border border-slate-200 shadow-lg">
              <button
                type="button"
                className="w-full px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                onClick={() => { setOpen(false); onDelete(row.id, row.name); }}
              >
                <Trash2 size={16} className="text-red-500" />
                {t('delete')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminEmployersPage() {
  const t = useTranslations('Admin.employersPage');
  const tCommon = useTranslations('Admin');

  const [list, setList] = useState<EmployerWithCompany[]>(() => getEmployers());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmployerStatus | 'all'>('all');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [banTarget, setBanTarget] = useState<{ id: string; name: string } | null>(null);
  const [banReason, setBanReason] = useState('');

  const refresh = useCallback(() => setList(getEmployers()), []);

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((row) => {
      const matchSearch = !q || row.name.toLowerCase().includes(q) || row.email.toLowerCase().includes(q) || row.companyName.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || row.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [list, search, statusFilter]);

  const handleSuspendReactivate = useCallback((id: string, status: 'active' | 'suspended') => {
    updateEmployerStatus(id, status);
    refresh();
  }, [refresh]);

  const handleBan = useCallback((id: string, reason?: string) => {
    banEmployer(id, reason);
    setBanTarget(null);
    setBanReason('');
    refresh();
  }, [refresh]);

  const handleDelete = useCallback((id: string) => {
    deleteEmployer(id);
    setDeleteTarget(null);
    refresh();
  }, [refresh]);

  const handleView = useCallback((_id: string) => {}, []);

  const roleLabel = (role: 'owner' | 'recruiter') => (role === 'owner' ? t('roleOwner') : t('roleRecruiter'));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#162C66]">{t('title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('subtitle')}</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-300 focus:border-slate-300 outline-none"
              aria-label={t('searchPlaceholder')}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-600 whitespace-nowrap">{t('filterStatus')}:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as EmployerStatus | 'all')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white focus:ring-2 focus:ring-slate-300 outline-none"
              aria-label={t('filterStatus')}
            >
              <option value="all">{t('statusAll')}</option>
              <option value="active">{t('statusActive')}</option>
              <option value="suspended">{t('statusSuspended')}</option>
              <option value="banned">{t('statusBanned')}</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {filteredList.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-slate-500">{t('emptyState')}</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{tCommon('name')}</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{tCommon('email')}</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{tCommon('company')}</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{tCommon('roleColumn')}</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{tCommon('statusColumn')}</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('createdAt')}</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('lastLogin')}</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-48">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((row) => (
                  <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/30">
                    <td className="px-6 py-3 text-sm font-medium text-slate-800">{row.name}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{row.email}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{row.companyName}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{roleLabel(row.role)}</td>
                    <td className="px-6 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">{formatDate(row.createdAt)}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{row.lastLogin ? formatDate(row.lastLogin) : t('never')}</td>
                    <td className="px-6 py-3">
                      <EmployerActions
                        row={row}
                        onView={handleView}
                        onSuspendReactivate={handleSuspendReactivate}
                        onBan={(id, name) => setBanTarget({ id, name })}
                        onDelete={(id, name) => setDeleteTarget({ id, name })}
                        t={t}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={t('confirmDeleteTitle')} size="sm" footer={
        <>
          <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>{t('cancel')}</Button>
          <Button variant="secondary" size="sm" className="!bg-red-600 !text-white hover:!bg-red-700" onClick={() => deleteTarget && handleDelete(deleteTarget.id)}>{t('delete')}</Button>
        </>
      }>
        {deleteTarget && <p className="text-sm text-slate-600">{t('confirmDeleteMessage')}</p>}
      </Modal>

      <Modal open={!!banTarget} onClose={() => { setBanTarget(null); setBanReason(''); }} title={t('confirmBanTitle')} size="md" footer={
        <>
          <Button variant="outline" size="sm" onClick={() => { setBanTarget(null); setBanReason(''); }}>{t('cancel')}</Button>
          <Button variant="secondary" size="sm" onClick={() => banTarget && handleBan(banTarget.id, banReason.trim() || undefined)}>{t('confirm')}</Button>
        </>
      }>
        {banTarget && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">{t('confirmBanMessage', { name: banTarget.name })}</p>
            <label className="block">
              <span className="block text-sm font-bold text-slate-700 mb-1">{t('banReasonLabel')}</span>
              <input type="text" value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder={t('banReasonPlaceholder')} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-slate-300 outline-none" />
            </label>
          </div>
        )}
      </Modal>
    </div>
  );
}
