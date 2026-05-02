'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { getToken } from '@/lib/auth';
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Plan {
  id: string;
  label: string;
  role: string;
  intervalType: string;
  intervalCount: number;
  amountCents: number;
  oldPriceCents: number | null;
  currency: string;
  stripePriceId: string | null;
  isActive: boolean;
  isBestOffer: boolean;
  sortOrder: number;
}

interface PremiumUser {
  id: string;
  userId: string;
  status: string;
  planDurationMonths: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd?: boolean;
  user: { id: string; email: string; displayName: string | null; role: string };
}

const INTERVAL_LABELS: Record<string, string> = { day: 'Tag(e)', week: 'Woche(n)', month: 'Monat(e)' };

function formatPrice(cents: number, currency: string = 'eur'): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

const emptyForm = {
  label: '',
  intervalType: 'month',
  intervalCount: 1,
  amountCents: '',
  oldPriceCents: '',
  isBestOffer: false,
  sortOrder: 0,
};

export default function AdminSubscriptionsPage() {
  const t = useTranslations('Admin.subscriptionsPage');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [premiumUsers, setPremiumUsers] = useState<PremiumUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [cancelBusyId, setCancelBusyId] = useState<string | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);

  async function handleCancelSub(subId: string, mode: 'period_end' | 'immediate') {
    if (cancelBusyId) return;
    setCancelBusyId(subId);
    try {
      const res = await fetch(`${API_URL}/api/admin/subscriptions/${subId}/cancel`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (!data.ok) {
        alert(`Fehler: ${data.error || 'unbekannt'}`);
      } else {
        await fetchData();
      }
    } catch (err) {
      alert('Netzwerkfehler');
    } finally {
      setCancelBusyId(null);
      setCancelConfirmId(null);
    }
  }

  const fetchData = useCallback(async () => {
    try {
      const [plansRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/plans`, { headers: authHeaders() }),
        fetch(`${API_URL}/api/admin/premium-users`, { headers: authHeaders() }),
      ]);
      const plansData = await plansRes.json();
      const usersData = await usersRes.json();
      // Only show employer plans
      setPlans((plansData.plans || []).filter((p: Plan) => p.role === 'employer'));
      setPremiumUsers(usersData.subscriptions || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (plan: Plan) => {
    setEditingId(plan.id);
    setForm({
      label: plan.label,
      intervalType: plan.intervalType,
      intervalCount: plan.intervalCount,
      amountCents: String((plan.amountCents / 100).toFixed(2)),
      oldPriceCents: plan.oldPriceCents != null ? String((plan.oldPriceCents / 100).toFixed(2)) : '',
      isBestOffer: plan.isBestOffer,
      sortOrder: plan.sortOrder,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        label: form.label,
        role: 'employer',
        intervalType: form.intervalType,
        intervalCount: Number(form.intervalCount),
        amountCents: Math.round(parseFloat(form.amountCents as string) * 100),
        oldPriceCents: form.oldPriceCents ? Math.round(parseFloat(form.oldPriceCents as string) * 100) : null,
        isBestOffer: form.isBestOffer,
        sortOrder: Number(form.sortOrder),
      };

      if (editingId) {
        await fetch(`${API_URL}/api/admin/plans/${editingId}`, {
          method: 'PUT', headers: authHeaders(), body: JSON.stringify(body),
        });
      } else {
        await fetch(`${API_URL}/api/admin/plans`, {
          method: 'POST', headers: authHeaders(), body: JSON.stringify(body),
        });
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await fetchData();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/admin/plans/${id}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      setDeleteConfirmId(null);
      await fetchData();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-[#162C66]" />
      </div>
    );
  }

  const activePlans = plans.filter(p => p.isActive);
  const inactivePlans = plans.filter(p => !p.isActive);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#162C66]">{t('title')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('subtitle')}</p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreate}>
          <Plus size={16} className="mr-1.5" />
          {t('addPlan')}
        </Button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <Card className="border-2 border-[#F5C400]/30">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[#162C66]">
              {editingId ? t('editPlan') : t('newPlan')}
            </h2>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Label */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('label')}</label>
              <input
                type="text"
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                placeholder="z.B. Premium 1 Monat"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400] outline-none"
              />
            </div>
            {/* Interval Type */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('intervalType')}</label>
              <select
                value={form.intervalType}
                onChange={e => setForm(f => ({ ...f, intervalType: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400] outline-none bg-white"
              >
                <option value="day">{t('day')}</option>
                <option value="week">{t('week')}</option>
                <option value="month">{t('month')}</option>
              </select>
            </div>
            {/* Interval Count */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('intervalCount')}</label>
              <input
                type="number"
                min={1}
                value={form.intervalCount}
                onChange={e => setForm(f => ({ ...f, intervalCount: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400] outline-none"
              />
            </div>
            {/* Price in EUR */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('priceEur')}</label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={form.amountCents}
                onChange={e => setForm(f => ({ ...f, amountCents: e.target.value }))}
                placeholder="z.B. 59.00"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400] outline-none"
              />
            </div>
            {/* Old Price in EUR */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('oldPriceEur')}</label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={form.oldPriceCents}
                onChange={e => setForm(f => ({ ...f, oldPriceCents: e.target.value }))}
                placeholder={t('optional')}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400] outline-none"
              />
            </div>
            {/* Sort Order */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('sortOrder')}</label>
              <input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400] outline-none"
              />
            </div>
          </div>
          {/* Best Offer Toggle */}
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, isBestOffer: !f.isBestOffer }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.isBestOffer ? 'bg-[#F5C400]' : 'bg-slate-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isBestOffer ? 'translate-x-5' : ''}`} />
            </button>
            <span className="text-sm font-medium text-slate-700">{t('bestOffer')}</span>
          </div>
          {/* Save Button */}
          <div className="mt-6 flex gap-3">
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving || !form.label || !form.amountCents}>
              {saving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
              {editingId ? t('save') : t('create')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditingId(null); }}>
              {t('cancel')}
            </Button>
          </div>
        </Card>
      )}

      {/* Active Plans */}
      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-[#162C66]">{t('plans')}</h2>
        </div>
        {activePlans.length === 0 ? (
          <p className="px-6 py-12 text-sm text-slate-500">{t('emptyPlans')}</p>
        ) : (
          <ul className="divide-y divide-slate-50">
            {activePlans.map(plan => (
              <li key={plan.id} className="px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-800">{plan.label}</p>
                    {plan.isBestOffer && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#F5C400]/20 text-[#162C66] rounded-full">
                        {t('bestOffer')}
                      </span>
                    )}
                    {plan.stripePriceId && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full">
                        Stripe ✓
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    {plan.intervalCount} {INTERVAL_LABELS[plan.intervalType] || plan.intervalType}
                    {plan.oldPriceCents != null && (
                      <> · <span className="line-through text-red-400">{formatPrice(plan.oldPriceCents, plan.currency)}</span></>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[#162C66] text-lg">{formatPrice(plan.amountCents, plan.currency)}</span>
                  <button onClick={() => openEdit(plan)} className="p-2 text-slate-400 hover:text-[#162C66] hover:bg-slate-50 rounded-lg transition-colors">
                    <Pencil size={16} />
                  </button>
                  {deleteConfirmId === plan.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600"
                      >
                        {t('confirmDelete')}
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirmId(plan.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Inactive Plans */}
      {inactivePlans.length > 0 && (
        <Card className="p-0 overflow-hidden opacity-60">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-400">{t('inactivePlans')}</h2>
          </div>
          <ul className="divide-y divide-slate-50">
            {inactivePlans.map(plan => (
              <li key={plan.id} className="px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-500">{plan.label}</p>
                  <p className="text-sm text-slate-400">
                    {plan.intervalCount} {INTERVAL_LABELS[plan.intervalType] || plan.intervalType}
                  </p>
                </div>
                <span className="font-bold text-slate-400">{formatPrice(plan.amountCents, plan.currency)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Premium Users */}
      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-[#162C66]">{t('activePremiumUsers')}</h2>
        </div>
        {premiumUsers.length === 0 ? (
          <p className="px-6 py-12 text-sm text-slate-500">{t('emptyPremiumUsers')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('user')}</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('plan')}</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('startedAt')}</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('expiresAt')}</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {premiumUsers.map(sub => (
                  <tr key={sub.id} className="border-b border-slate-50 hover:bg-slate-50/30">
                    <td className="px-6 py-3">
                      <p className="font-medium text-slate-800">{sub.user.displayName || '—'}</p>
                      <p className="text-sm text-slate-500">{sub.user.email}</p>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">
                      {sub.planDurationMonths} {sub.planDurationMonths === 1 ? 'Monat' : 'Monate'}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">{formatDate(sub.currentPeriodStart)}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">
                      {formatDate(sub.currentPeriodEnd)}
                      {sub.cancelAtPeriodEnd && (
                        <span className="ml-2 text-[10px] font-bold uppercase px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded">gekündigt</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {cancelConfirmId === sub.id ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleCancelSub(sub.id, 'period_end')}
                            disabled={cancelBusyId === sub.id}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-amber-500 rounded-lg hover:bg-amber-600 disabled:opacity-50"
                            title="Zum Laufzeitende kündigen (Kunde behält Zugang bis Enddatum)"
                          >
                            Zum Ende
                          </button>
                          <button
                            onClick={() => handleCancelSub(sub.id, 'immediate')}
                            disabled={cancelBusyId === sub.id}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50"
                            title="Sofort kündigen (Zugang wird sofort entzogen)"
                          >
                            Sofort
                          </button>
                          <button
                            onClick={() => setCancelConfirmId(null)}
                            disabled={cancelBusyId === sub.id}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200"
                          >
                            Abbrechen
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setCancelConfirmId(sub.id)}
                          disabled={sub.cancelAtPeriodEnd}
                          className="px-2.5 py-1 text-xs font-semibold text-red-500 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Kündigen
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
