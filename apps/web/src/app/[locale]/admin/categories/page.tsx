'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import {
  Loader2, Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronRight, FolderOpen,
} from 'lucide-react';
import { clsx } from 'clsx';

const LOCALES = ['de', 'en', 'fr', 'it', 'sq'] as const;
type Locale = (typeof LOCALES)[number];

interface CatTitle {
  id: string;
  key: string;
  labels: Record<Locale, string>;
}

interface CatGroup {
  id: string;
  slug: string;
  icon: string;
  labels: Record<Locale, string>;
  order: number;
  titles: CatTitle[];
}

export default function AdminCategoriesPage() {
  const t = useTranslations('Admin.categoriesPage');
  const uiLocale = useLocale() as Locale;
  const [categories, setCategories] = useState<CatGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [seeding, setSeeding] = useState(false);

  // Category modal
  const [catModal, setCatModal] = useState<'create' | 'edit' | null>(null);
  const [editCat, setEditCat] = useState<CatGroup | null>(null);
  const [catForm, setCatForm] = useState({ slug: '', icon: '', labels: { de: '', en: '', fr: '', it: '', sq: '' } });
  const [catSaving, setCatSaving] = useState(false);

  // Title modal
  const [titleModal, setTitleModal] = useState<'create' | 'edit' | null>(null);
  const [titleCatId, setTitleCatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<CatTitle | null>(null);
  const [titleForm, setTitleForm] = useState({ key: '', labels: { de: '', en: '', fr: '', it: '', sq: '' } });
  const [titleSaving, setTitleSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.get<{ ok: boolean; categories: CatGroup[] }>('/api/admin/categories', token);
      if (res.ok) setCategories(res.categories);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Seed ──
  const handleSeed = async () => {
    const token = getToken();
    if (!token) return;
    setSeeding(true);
    try {
      const res = await api.post<{ ok: boolean }>('/api/admin/categories/seed', {}, token);
      if (res.ok) await fetchCategories();
    } catch {}
    setSeeding(false);
  };

  // ── Category CRUD ──
  const openCreateCat = () => {
    setCatForm({ slug: '', icon: '', labels: { de: '', en: '', fr: '', it: '', sq: '' } });
    setEditCat(null);
    setCatModal('create');
  };

  const openEditCat = (c: CatGroup) => {
    setEditCat(c);
    setCatForm({ slug: c.slug, icon: c.icon, labels: { ...c.labels } as any });
    setCatModal('edit');
  };

  const saveCat = async () => {
    const token = getToken();
    if (!token) return;
    setCatSaving(true);
    try {
      if (catModal === 'create') {
        const res = await api.post<{ ok: boolean; category: CatGroup }>('/api/admin/categories', catForm, token);
        if (res.ok) { setCategories(prev => [...prev, res.category]); setCatModal(null); }
      } else if (editCat) {
        const res = await api.put<{ ok: boolean; category: CatGroup }>(`/api/admin/categories/${editCat.id}`, catForm, token);
        if (res.ok) { setCategories(prev => prev.map(c => c.id === editCat.id ? res.category : c)); setCatModal(null); }
      }
    } catch {}
    setCatSaving(false);
  };

  const deleteCat = async (id: string, name: string) => {
    if (!confirm(t('confirmDeleteCat', { name }))) return;
    const token = getToken();
    if (!token) return;
    try {
      const res = await api.delete<{ ok: boolean }>(`/api/admin/categories/${id}`, token);
      if (res.ok) setCategories(prev => prev.filter(c => c.id !== id));
    } catch {}
  };

  // ── Title CRUD ──
  const openCreateTitle = (catId: string) => {
    setTitleCatId(catId);
    setEditTitle(null);
    setTitleForm({ key: '', labels: { de: '', en: '', fr: '', it: '', sq: '' } });
    setTitleModal('create');
  };

  const openEditTitle = (catId: string, title: CatTitle) => {
    setTitleCatId(catId);
    setEditTitle(title);
    setTitleForm({ key: title.key, labels: { ...title.labels } as any });
    setTitleModal('edit');
  };

  const saveTitle = async () => {
    const token = getToken();
    if (!token || !titleCatId) return;
    setTitleSaving(true);
    try {
      if (titleModal === 'create') {
        const res = await api.post<{ ok: boolean; title: CatTitle }>(`/api/admin/categories/${titleCatId}/titles`, titleForm, token);
        if (res.ok) {
          setCategories(prev => prev.map(c => c.id === titleCatId ? { ...c, titles: [...c.titles, res.title] } : c));
          setTitleModal(null);
        }
      } else if (editTitle) {
        const res = await api.put<{ ok: boolean; title: CatTitle }>(`/api/admin/categories/${titleCatId}/titles/${editTitle.id}`, titleForm, token);
        if (res.ok) {
          setCategories(prev => prev.map(c => c.id === titleCatId ? { ...c, titles: c.titles.map(tt => tt.id === editTitle.id ? res.title : tt) } : c));
          setTitleModal(null);
        }
      }
    } catch {}
    setTitleSaving(false);
  };

  const deleteTitle = async (catId: string, titleId: string, name: string) => {
    if (!confirm(t('confirmDeleteTitle', { name }))) return;
    const token = getToken();
    if (!token) return;
    try {
      const res = await api.delete<{ ok: boolean }>(`/api/admin/categories/${catId}/titles/${titleId}`, token);
      if (res.ok) {
        setCategories(prev => prev.map(c => c.id === catId ? { ...c, titles: c.titles.filter(tt => tt.id !== titleId) } : c));
      }
    } catch {}
  };

  const label = (labels: Record<string, string>) => labels[uiLocale] || labels['de'] || labels['en'] || '';

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-[#162C66] mb-1">{t('title')}</h1>
          <p className="text-slate-500 font-medium text-sm">{t('subtitle', { count: categories.length })}</p>
        </div>
        <div className="flex gap-2">
          {categories.length === 0 && !loading && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2"
            >
              {seeding ? <Loader2 size={14} className="animate-spin" /> : <FolderOpen size={14} />}
              {t('importDefaults')}
            </button>
          )}
          <button
            onClick={openCreateCat}
            className="px-4 py-2.5 bg-[#162C66] text-white rounded-xl text-sm font-bold hover:bg-[#1a3577] flex items-center gap-2"
          >
            <Plus size={14} />
            {t('addCategory')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#162C66]" />
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <FolderOpen size={40} className="mx-auto mb-3 text-slate-200" />
          <p className="font-semibold text-slate-400">{t('empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              {/* Category header */}
              <div className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 hover:bg-slate-50/50 transition-colors gap-2">
                <button onClick={() => toggle(cat.id)} className="flex items-center gap-2 sm:gap-3 flex-1 text-left min-w-0">
                  {expanded.has(cat.id)
                    ? <ChevronDown size={18} className="text-slate-400 shrink-0" />
                    : <ChevronRight size={18} className="text-slate-400 shrink-0" />
                  }
                  <span className="text-xl shrink-0">{cat.icon}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-[#162C66] truncate">{label(cat.labels)}</p>
                    <p className="text-xs text-slate-400 truncate">{cat.slug} &middot; {cat.titles.length} {t('titlesCount')}</p>
                  </div>
                </button>
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                  <button onClick={() => openCreateTitle(cat.id)} className="w-8 h-8 sm:w-8 sm:h-8 rounded-lg bg-green-50 text-green-500 hover:bg-green-100 hover:text-green-600 flex items-center justify-center transition-all" title={t('addTitle')}>
                    <Plus size={14} />
                  </button>
                  <button onClick={() => openEditCat(cat)} className="w-8 h-8 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-blue-400 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center transition-all" title={t('editCategory')}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deleteCat(cat.id, label(cat.labels))} className="w-8 h-8 sm:w-8 sm:h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-all" title={t('deleteCategory')}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Titles */}
              {expanded.has(cat.id) && (
                <div className="border-t border-slate-100">
                  {cat.titles.length === 0 ? (
                    <p className="px-5 sm:px-12 py-4 text-sm text-slate-400 italic">{t('noTitles')}</p>
                  ) : (
                    <>
                      {/* Desktop table */}
                      <table className="w-full text-sm hidden sm:table">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="text-left px-5 md:px-12 py-2.5 font-bold text-slate-400 text-xs uppercase">{t('colKey')}</th>
                            <th className="text-left px-5 py-2.5 font-bold text-slate-400 text-xs uppercase">DE</th>
                            <th className="text-left px-5 py-2.5 font-bold text-slate-400 text-xs uppercase hidden md:table-cell">EN</th>
                            <th className="text-right px-5 py-2.5 font-bold text-slate-400 text-xs uppercase">{t('colActions')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cat.titles.map((title) => (
                            <tr key={title.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                              <td className="px-5 md:px-12 py-3 font-medium text-[#162C66]">{title.key}</td>
                              <td className="px-5 py-3 text-slate-500">{title.labels.de}</td>
                              <td className="px-5 py-3 text-slate-500 hidden md:table-cell">{title.labels.en}</td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-1.5 justify-end">
                                  <button onClick={() => openEditTitle(cat.id, title)} className="w-7 h-7 rounded-lg bg-blue-50 text-blue-400 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center transition-all">
                                    <Pencil size={12} />
                                  </button>
                                  <button onClick={() => deleteTitle(cat.id, title.id, title.key)} className="w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-all">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Mobile card list */}
                      <div className="sm:hidden divide-y divide-slate-100">
                        {cat.titles.map((title) => (
                          <div key={title.id} className="flex items-center justify-between px-3 py-3 gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-[#162C66] text-sm truncate">{title.key}</p>
                              <p className="text-xs text-slate-400 truncate">{title.labels.de || title.labels.en}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button onClick={() => openEditTitle(cat.id, title)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-400 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center transition-all">
                                <Pencil size={14} />
                              </button>
                              <button onClick={() => deleteTitle(cat.id, title.id, title.key)} className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-all">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Category Modal */}
      {catModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setCatModal(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg sm:mx-4 p-5 sm:p-6 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-[#162C66]">{catModal === 'create' ? t('addCategory') : t('editCategory')}</h3>
              <button onClick={() => setCatModal(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Slug</label>
                  <input type="text" value={catForm.slug} onChange={e => setCatForm(p => ({ ...p, slug: e.target.value }))} placeholder="care-cleaning" className="w-full px-3 sm:px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-[#F5C400] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Icon (Emoji)</label>
                  <input type="text" value={catForm.icon} onChange={e => setCatForm(p => ({ ...p, icon: e.target.value }))} placeholder="🧹" className="w-full px-3 sm:px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-[#F5C400] outline-none" />
                </div>
              </div>
              {LOCALES.map(loc => (
                <div key={loc}>
                  <label className="block text-xs font-bold text-slate-500 mb-1">{t('labelFor', { locale: loc.toUpperCase() })}</label>
                  <input type="text" value={(catForm.labels as any)[loc] || ''} onChange={e => setCatForm(p => ({ ...p, labels: { ...p.labels, [loc]: e.target.value } }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-[#F5C400] outline-none" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setCatModal(null)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50">{t('cancel')}</button>
              <button onClick={saveCat} disabled={catSaving || !catForm.slug || !catForm.icon} className="flex-1 px-4 py-2.5 bg-[#162C66] text-white rounded-xl text-sm font-bold hover:bg-[#1a3577] disabled:opacity-50 flex items-center justify-center gap-2">
                {catSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Title Modal */}
      {titleModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setTitleModal(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg sm:mx-4 p-5 sm:p-6 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-[#162C66]">{titleModal === 'create' ? t('addTitle') : t('editTitle')}</h3>
              <button onClick={() => setTitleModal(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">{t('colKey')} (SQ)</label>
                <input type="text" value={titleForm.key} onChange={e => setTitleForm(p => ({ ...p, key: e.target.value }))} placeholder="Babysiter" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-[#F5C400] outline-none" />
              </div>
              {LOCALES.map(loc => (
                <div key={loc}>
                  <label className="block text-xs font-bold text-slate-500 mb-1">{t('labelFor', { locale: loc.toUpperCase() })}</label>
                  <input type="text" value={(titleForm.labels as any)[loc] || ''} onChange={e => setTitleForm(p => ({ ...p, labels: { ...p.labels, [loc]: e.target.value } }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-[#F5C400] outline-none" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setTitleModal(null)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50">{t('cancel')}</button>
              <button onClick={saveTitle} disabled={titleSaving || !titleForm.key} className="flex-1 px-4 py-2.5 bg-[#162C66] text-white rounded-xl text-sm font-bold hover:bg-[#1a3577] disabled:opacity-50 flex items-center justify-center gap-2">
                {titleSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
