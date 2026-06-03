'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import {
  Bell, Send, Users, Smartphone, Loader2, Check, X, AlertCircle,
  History, ChevronDown, Filter as FilterIcon,
} from 'lucide-react';
import { clsx } from 'clsx';

const LOCALES = [
  { code: '', label: 'All languages' },
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'sq', label: 'Shqip' },
] as const;

const COUNTRIES = [
  { code: '', label: 'All countries' },
  { code: 'CH', label: 'Switzerland (CH)' },
  { code: 'DE', label: 'Germany (DE)' },
  { code: 'AT', label: 'Austria (AT)' },
  { code: 'FR', label: 'France (FR)' },
  { code: 'IT', label: 'Italy (IT)' },
  { code: 'AL', label: 'Albania (AL)' },
  { code: 'XK', label: 'Kosovo (XK)' },
  { code: 'MK', label: 'North Macedonia (MK)' },
] as const;

const MAX_TITLE = 65;
const MAX_BODY = 240;

type Filter = {
  role?: 'job-seeker' | 'employer';
  isPremium?: boolean;
  locale?: string;
  countryCode?: string;
};

type PreviewResp = { ok: true; users: number; devices: number };
type BroadcastResp = { ok: true; users: number; devices: number; sent: number; failed: number };

type HistoryItem = {
  id: string;
  title: string;
  body: string;
  filter: Filter;
  usersTargeted: number;
  devicesTargeted: number;
  devicesSent: number;
  devicesFailed: number;
  createdAt: string;
  admin: { id: string; email: string; displayName: string | null };
};

export default function AdminPushPage() {
  const [filter, setFilter] = useState<Filter>({});
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [preview, setPreview] = useState<{ users: number; devices: number } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // ── Preview audience whenever filter changes (debounced) ──
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    setPreviewLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res = await api.post<PreviewResp>('/api/admin/push/preview', { filter }, token);
        if (res?.ok) setPreview({ users: res.users, devices: res.devices });
      } catch {
        setPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [filter]);

  // ── Load history ──
  const loadHistory = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setHistoryLoading(true);
    try {
      const res = await api.get<{ ok: true; items: HistoryItem[] }>(
        '/api/admin/push/history',
        token
      );
      if (res?.ok) setHistory(res.items);
    } catch {}
    setHistoryLoading(false);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const canSend = useMemo(
    () =>
      title.trim().length > 0 &&
      body.trim().length > 0 &&
      title.length <= MAX_TITLE &&
      body.length <= MAX_BODY &&
      (preview?.devices ?? 0) > 0 &&
      !sending,
    [title, body, preview, sending]
  );

  async function handleSend() {
    setConfirmOpen(false);
    const token = getToken();
    if (!token) return;
    setSending(true);
    try {
      const res = await api.post<BroadcastResp>(
        '/api/admin/push/broadcast',
        { filter, title: title.trim(), body: body.trim() },
        token
      );
      if (res?.ok) {
        setToast({
          kind: 'ok',
          msg: `Sent ${res.sent} / ${res.devices} (failed: ${res.failed})`,
        });
        setTitle('');
        setBody('');
        loadHistory();
      } else {
        setToast({ kind: 'err', msg: 'Broadcast failed' });
      }
    } catch (err: any) {
      setToast({ kind: 'err', msg: err?.message ?? 'Broadcast failed' });
    } finally {
      setSending(false);
      setTimeout(() => setToast(null), 4000);
    }
  }

  function setRole(role: '' | 'job-seeker' | 'employer') {
    setFilter((f) => ({ ...f, role: role || undefined }));
  }
  function setPremium(val: '' | 'true' | 'false') {
    setFilter((f) => ({ ...f, isPremium: val === '' ? undefined : val === 'true' }));
  }
  function setLocale(loc: string) {
    setFilter((f) => ({ ...f, locale: loc || undefined }));
  }
  function setCountry(c: string) {
    setFilter((f) => ({ ...f, countryCode: c || undefined }));
  }

  const audienceLabel = useMemo(() => {
    const parts: string[] = [];
    if (filter.role) parts.push(filter.role === 'employer' ? 'Employers' : 'Job seekers');
    else parts.push('All users');
    if (filter.isPremium === true) parts.push('Premium');
    if (filter.isPremium === false) parts.push('non-Premium');
    if (filter.locale) parts.push(filter.locale.toUpperCase());
    if (filter.countryCode) parts.push(filter.countryCode);
    return parts.join(' · ');
  }, [filter]);

  return (
    <div className="lg:pt-0 pt-16">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#162C66]">
          <Bell className="text-[#F5C400]" size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B1F44]">Push Notifications</h1>
          <p className="text-sm text-slate-500">Send announcements to mobile app users</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* ── Composer ───────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Audience filter */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <FilterIcon size={16} className="text-slate-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                Audience
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="User type">
                <select
                  value={filter.role ?? ''}
                  onChange={(e) => setRole(e.target.value as '' | 'job-seeker' | 'employer')}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#162C66] focus:outline-none"
                >
                  <option value="">All users</option>
                  <option value="job-seeker">Job seekers only</option>
                  <option value="employer">Employers only</option>
                </select>
              </Field>

              <Field label="Premium status">
                <select
                  value={filter.isPremium === undefined ? '' : String(filter.isPremium)}
                  onChange={(e) => setPremium(e.target.value as '' | 'true' | 'false')}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#162C66] focus:outline-none"
                >
                  <option value="">Any</option>
                  <option value="true">Premium only</option>
                  <option value="false">Non-Premium only</option>
                </select>
              </Field>

              <Field label="Language">
                <select
                  value={filter.locale ?? ''}
                  onChange={(e) => setLocale(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#162C66] focus:outline-none"
                >
                  {LOCALES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Country">
                <select
                  value={filter.countryCode ?? ''}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#162C66] focus:outline-none"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          {/* Message */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Bell size={16} className="text-slate-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                Message
              </h2>
            </div>

            <Field label="Title" hint={`${title.length} / ${MAX_TITLE}`}>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. New jobs in your area"
                maxLength={MAX_TITLE}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#162C66] focus:outline-none"
              />
            </Field>

            <Field label="Body" hint={`${body.length} / ${MAX_BODY}`}>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="The notification message users will see"
                maxLength={MAX_BODY}
                rows={4}
                className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#162C66] focus:outline-none"
              />
            </Field>

            {/* Preview card */}
            {(title || body) && (
              <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Preview
                </div>
                <div className="rounded-xl bg-white p-3 shadow-sm">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 h-6 w-6 shrink-0 rounded-md bg-[#F5C400]" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        gjejpune24 · now
                      </div>
                      <div className="mt-0.5 text-sm font-bold text-slate-900">
                        {title || 'Title'}
                      </div>
                      <div className="text-sm text-slate-600">{body || 'Body'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ── Sidebar: Audience + Send + History ─────────────────── */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <Users size={16} className="text-slate-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                Audience reach
              </h2>
            </div>

            <div className="rounded-xl bg-[#162C66] p-4 text-white">
              <div className="text-[11px] font-bold uppercase tracking-wider text-white/60">
                {audienceLabel}
              </div>
              {previewLoading ? (
                <div className="mt-3 flex items-center gap-2 text-white/70">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Calculating…</span>
                </div>
              ) : preview ? (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold">{preview.users}</span>
                    <span className="text-xs text-white/70">users</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-white/80">
                    <Smartphone size={12} />
                    <span>{preview.devices} devices</span>
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-sm text-white/70">No data</div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={!canSend}
              className={clsx(
                'mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition',
                canSend
                  ? 'bg-[#F5C400] text-[#162C66] hover:bg-[#E6B800]'
                  : 'cursor-not-allowed bg-slate-200 text-slate-400'
              )}
            >
              {sending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Send size={16} />
                  <span>
                    Send to {preview?.devices ?? 0} devices
                  </span>
                </>
              )}
            </button>

            {preview && preview.devices === 0 && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>
                  No registered devices match this filter. Try widening the audience.
                </span>
              </div>
            )}
          </section>

          {/* History */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History size={16} className="text-slate-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                  Recent broadcasts
                </h2>
              </div>
              <button
                onClick={loadHistory}
                className="text-xs font-semibold text-[#162C66] hover:underline"
              >
                Refresh
              </button>
            </div>

            {historyLoading ? (
              <div className="flex items-center justify-center py-6 text-slate-400">
                <Loader2 size={18} className="animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No broadcasts yet
              </div>
            ) : (
              <ul className="space-y-3">
                {history.map((h) => (
                  <li
                    key={h.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                  >
                    <div className="text-sm font-bold text-[#0B1F44]">{h.title}</div>
                    <div className="mt-0.5 line-clamp-2 text-xs text-slate-600">
                      {h.body}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                      <span>{new Date(h.createdAt).toLocaleString()}</span>
                      <span>·</span>
                      <span>
                        {h.devicesSent}/{h.devicesTargeted} sent
                      </span>
                      {h.devicesFailed > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-red-500">{h.devicesFailed} failed</span>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* Confirm modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-extrabold text-[#0B1F44]">Send broadcast?</h3>
            <p className="mt-2 text-sm text-slate-600">
              This will send a push notification to <strong>{preview?.devices ?? 0}</strong>{' '}
              device(s) ({preview?.users ?? 0} user(s)) matching:{' '}
              <span className="font-semibold">{audienceLabel}</span>.
            </p>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-bold text-slate-500">PREVIEW</div>
              <div className="mt-1 text-sm font-bold text-[#0B1F44]">{title}</div>
              <div className="text-sm text-slate-600">{body}</div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                className="flex items-center gap-2 rounded-lg bg-[#162C66] px-4 py-2 text-sm font-bold text-white hover:bg-[#0F1F4D]"
              >
                <Send size={14} />
                Confirm send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={clsx(
            'fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lg',
            toast.kind === 'ok' ? 'bg-emerald-600' : 'bg-red-600'
          )}
        >
          {toast.kind === 'ok' ? <Check size={16} /> : <X size={16} />}
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {label}
        </label>
        {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
