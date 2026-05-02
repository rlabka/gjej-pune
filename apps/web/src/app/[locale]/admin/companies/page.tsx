'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { Link } from '@/i18n/routing';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import {
  getCompanies,
  getCompany,
  updateCompanyVerified,
  setCompanyDisabled,
  deleteCompany,
  type Company
} from '@/data/mockAdminCompanies';
import { Search, Eye, CheckCircle, XCircle, Ban, Trash2, MoreVertical } from 'lucide-react';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function CompanyActions({
  row,
  onVerifyUnverify,
  onRequestDisable,
  onEnable,
  onDelete,
  t
}: {
  row: Company;
  onVerifyUnverify: (id: string, verified: boolean) => void;
  onRequestDisable: (id: string, name: string) => void;
  onEnable: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  t: (key: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const disabled = row.disabled ?? false;

  return (
    <div className="relative flex items-center gap-2 flex-wrap">
      <Link href={`/admin/companies/${row.id}`} className="inline-flex items-center justify-center p-2 rounded-lg text-slate-600 hover:bg-slate-100" title={t('view')}>
        <Eye size={18} />
      </Link>
      <Button variant="ghost" size="sm" onClick={() => onVerifyUnverify(row.id, !row.verified)} className="!p-2" title={row.verified ? t('unverify') : t('verify')}>
        {row.verified ? <XCircle size={18} className="text-slate-500" /> : <CheckCircle size={18} className="text-green-600" />}
      </Button>
      {disabled ? (
        <Button variant="ghost" size="sm" onClick={() => onEnable(row.id)} className="!p-2 text-green-600" title={t('enable')}>
          <CheckCircle size={18} />
        </Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => onRequestDisable(row.id, row.name)} className="!p-2 text-amber-600 hover:text-amber-700" title={t('disable')}>
          <Ban size={18} />
        </Button>
      )}
      <div className="relative">
        <Button variant="ghost" size="sm" onClick={() => setOpen(!open)} className="!p-2" aria-expanded={open} aria-haspopup="true">
          <MoreVertical size={18} />
        </Button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" aria-hidden onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-1 z-20 w-48 py-1 bg-white rounded-xl border border-slate-200 shadow-lg">
              <button type="button" className="w-full px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2" onClick={() => { setOpen(false); onDelete(row.id, row.name); }}>
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

export default function AdminCompaniesPage() {
  const t = useTranslations('Admin.companiesPage');
  const tCommon = useTranslations('Admin');

  const [list, setList] = useState<Company[]>(() => getCompanies());
  const [search, setSearch] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [disableTarget, setDisableTarget] = useState<{ id: string; name: string } | null>(null);

  const refresh = useCallback(() => setList(getCompanies()), []);

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((row) => {
      const matchSearch = !q || row.name.toLowerCase().includes(q) || row.industry.toLowerCase().includes(q) || row.location.toLowerCase().includes(q);
      const matchVerified = verifiedFilter === 'all' || (verifiedFilter === 'yes' && row.verified) || (verifiedFilter === 'no' && !row.verified);
      return matchSearch && matchVerified;
    });
  }, [list, search, verifiedFilter]);

  const handleVerifyUnverify = useCallback((id: string, verified: boolean) => {
    updateCompanyVerified(id, verified);
    refresh();
  }, [refresh]);

  const handleDelete = useCallback((id: string) => {
    deleteCompany(id);
    setDeleteTarget(null);
    refresh();
  }, [refresh]);

  const handleDisableConfirm = useCallback((id: string) => {
    setCompanyDisabled(id, true);
    setDisableTarget(null);
    refresh();
  }, [refresh]);

  const handleEnable = useCallback((id: string) => {
    setCompanyDisabled(id, false);
    refresh();
  }, [refresh]);

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
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-300 outline-none"
              aria-label={t('searchPlaceholder')}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-600 whitespace-nowrap">{t('filterVerified')}:</span>
            <select
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value as 'all' | 'yes' | 'no')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white focus:ring-2 focus:ring-slate-300 outline-none"
              aria-label={t('filterVerified')}
            >
              <option value="all">{t('verifiedAll')}</option>
              <option value="yes">{t('verifiedYes')}</option>
              <option value="no">{t('verifiedNo')}</option>
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
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('industry')}</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('location')}</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('verified')}</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('jobsCount')}</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('employersCount')}</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-40">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((row) => (
                  <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/30">
                    <td className="px-6 py-3 text-sm font-medium text-slate-800">{row.name}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{row.industry}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{row.location}</td>
                    <td className="px-6 py-3">
                      {row.verified ? <Badge variant="success">{t('verifiedYes')}</Badge> : <Badge variant="default">{t('verifiedNo')}</Badge>}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">{row.jobsCount}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{row.employersCount}</td>
                    <td className="px-6 py-3">
                      <CompanyActions
                        row={row}
                        onVerifyUnverify={handleVerifyUnverify}
                        onRequestDisable={(id, name) => setDisableTarget({ id, name })}
                        onEnable={handleEnable}
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

      <Modal open={!!disableTarget} onClose={() => setDisableTarget(null)} title={t('confirmDisableTitle')} size="sm" footer={
        <>
          <Button variant="outline" size="sm" onClick={() => setDisableTarget(null)}>{t('cancel')}</Button>
          <Button variant="secondary" size="sm" onClick={() => disableTarget && handleDisableConfirm(disableTarget.id)}>{t('confirm')}</Button>
        </>
      }>
        {disableTarget && <p className="text-sm text-slate-600">{t('confirmDisableMessage')}</p>}
      </Modal>
    </div>
  );
}
