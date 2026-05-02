'use client';

import { useState, useEffect, useCallback } from 'react';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { Check, X, Trash2, Upload, Loader2, Image, Building2, Mail, Globe, Clock, Eye, Ban } from 'lucide-react';
import { clsx } from 'clsx';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface AdPlacement {
  id: string;
  companyName: string;
  companyEmail: string;
  companyWebsite: string | null;
  logoUrl: string | null;
  plan: string;
  durationMonths: number;
  amountCents: number;
  currency: string;
  status: string;
  paidAt: string | null;
  activatedAt: string | null;
  expiresAt: string | null;
  rejectedReason: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pending_payment: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Ausstehend' },
  paid: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Bezahlt' },
  active: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Aktiv' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', label: 'Abgelehnt' },
  expired: { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Abgelaufen' },
};

const TABS = [
  { key: '', label: 'Alle' },
  { key: 'paid', label: 'Bezahlt' },
  { key: 'active', label: 'Aktiv' },
  { key: 'expired', label: 'Abgelaufen' },
  { key: 'rejected', label: 'Abgelehnt' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatPrice(cents: number): string {
  return `${(cents / 100).toFixed(0)} CHF`;
}

export default function AdPlacementsPage() {
  const [ads, setAds] = useState<AdPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadAds = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const params = filter ? `?status=${filter}` : '';
      const res = await api.get<{ ok: boolean; ads: AdPlacement[] }>(`/api/admin/ad-placements${params}`, token);
      if (res.ok) setAds(res.ads);
    } catch (err) {
      console.error('Failed to load ad placements:', err);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => { loadAds(); }, [loadAds]);

  const handleActivate = async (id: string) => {
    const token = getToken();
    if (!token) return;
    setActionLoading(id);
    try {
      await api.post(`/api/admin/ad-placements/${id}/activate`, {}, token);
      await loadAds();
    } catch (err) { console.error(err); }
    setActionLoading(null);
  };

  const handleReject = async () => {
    if (!rejectId) return;
    const token = getToken();
    if (!token) return;
    setActionLoading(rejectId);
    try {
      await api.post(`/api/admin/ad-placements/${rejectId}/reject`, { reason: rejectReason }, token);
      setRejectId(null);
      setRejectReason('');
      await loadAds();
    } catch (err) { console.error(err); }
    setActionLoading(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Wirklich löschen?')) return;
    const token = getToken();
    if (!token) return;
    setActionLoading(id);
    try {
      await api.delete(`/api/admin/ad-placements/${id}`, token);
      await loadAds();
    } catch (err) { console.error(err); }
    setActionLoading(null);
  };

  const handleUploadLogo = async (id: string, file: File) => {
    const token = getToken();
    if (!token) return;
    setActionLoading(id);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      await fetch(`${API_URL}/api/admin/ad-placements/${id}/logo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      await loadAds();
    } catch (err) { console.error(err); }
    setActionLoading(null);
  };

  const counts = {
    all: ads.length,
    paid: ads.filter(a => a.status === 'paid').length,
    active: ads.filter(a => a.status === 'active').length,
    expired: ads.filter(a => a.status === 'expired').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-[#0B1F44]">Werbung / Logo-Platzierungen</h1>
          <p className="text-sm text-slate-400 mt-1">Firmenlogos auf der Startseite verwalten</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Gesamt', value: counts.all, color: 'text-slate-700' },
          { label: 'Warten auf Review', value: counts.paid, color: 'text-blue-600' },
          { label: 'Aktiv', value: counts.active, color: 'text-emerald-600' },
          { label: 'Abgelaufen', value: counts.expired, color: 'text-slate-400' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-xl p-4">
            <p className={clsx('text-2xl font-black', s.color)}>{s.value}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-50 p-1 rounded-xl overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setFilter(tab.key); setLoading(true); }}
            className={clsx(
              'px-4 py-2 text-[12px] font-bold rounded-lg transition-all whitespace-nowrap',
              filter === tab.key ? 'bg-white text-[#0B1F44] shadow-sm' : 'text-slate-400 hover:text-slate-600'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
      ) : ads.length === 0 ? (
        <div className="text-center py-16">
          <Image size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Keine Einträge gefunden</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ads.map((ad) => {
            const st = STATUS_COLORS[ad.status] || STATUS_COLORS.pending_payment;
            const isLoading = actionLoading === ad.id;
            return (
              <div key={ad.id} className="bg-white border border-slate-100 rounded-xl p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Logo */}
                  <div className="shrink-0 w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                    {ad.logoUrl ? (
                      <img src={ad.logoUrl.startsWith('/uploads/') ? `${API_URL}${ad.logoUrl}` : ad.logoUrl} alt="" className="w-full h-full object-contain p-1" />
                    ) : (
                      <Building2 size={24} className="text-slate-300" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[14px] font-bold text-[#0B1F44] truncate">{ad.companyName}</h3>
                      <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full', st.bg, st.text)}>
                        {st.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-400">
                      <span className="flex items-center gap-1"><Mail size={10} />{ad.companyEmail}</span>
                      {ad.companyWebsite && <span className="flex items-center gap-1"><Globe size={10} />{ad.companyWebsite}</span>}
                      <span className="flex items-center gap-1"><Clock size={10} />{ad.durationMonths} Monate &middot; {formatPrice(ad.amountCents)}</span>
                      {ad.paidAt && <span>Bezahlt: {formatDate(ad.paidAt)}</span>}
                      {ad.activatedAt && <span>Aktiv seit: {formatDate(ad.activatedAt)}</span>}
                      {ad.expiresAt && <span>Läuft ab: {formatDate(ad.expiresAt)}</span>}
                    </div>
                    {ad.rejectedReason && (
                      <p className="mt-1 text-[11px] text-red-500">Grund: {ad.rejectedReason}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    {isLoading && <Loader2 size={16} className="animate-spin text-slate-400" />}

                    {ad.status === 'paid' && (
                      <>
                        {!ad.logoUrl && (
                          <label className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#162C66] hover:bg-[#162C66]/5 cursor-pointer transition-colors" title="Logo hochladen">
                            <Upload size={15} />
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) handleUploadLogo(ad.id, e.target.files[0]); }} />
                          </label>
                        )}
                        <button onClick={() => handleActivate(ad.id)} disabled={isLoading} className="w-8 h-8 flex items-center justify-center rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors" title="Aktivieren">
                          <Check size={15} />
                        </button>
                        <button onClick={() => { setRejectId(ad.id); setRejectReason(''); }} disabled={isLoading} className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition-colors" title="Ablehnen">
                          <Ban size={15} />
                        </button>
                      </>
                    )}

                    {ad.status === 'active' && !ad.logoUrl && (
                      <label className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#162C66] hover:bg-[#162C66]/5 cursor-pointer transition-colors" title="Logo hochladen">
                        <Upload size={15} />
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) handleUploadLogo(ad.id, e.target.files[0]); }} />
                      </label>
                    )}

                    <button onClick={() => handleDelete(ad.id)} disabled={isLoading} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Löschen">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setRejectId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-[15px] font-bold text-[#0B1F44] mb-3">Ablehnen</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Grund (optional)"
              rows={3}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-[#0B1F44] placeholder:text-slate-400 outline-none focus:border-[#162C66]/20 resize-none"
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setRejectId(null)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-500 hover:bg-slate-50">
                Abbrechen
              </button>
              <button onClick={handleReject} disabled={actionLoading === rejectId} className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg text-[13px] font-bold hover:bg-red-600 disabled:opacity-50">
                Ablehnen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
