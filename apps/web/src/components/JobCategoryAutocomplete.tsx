'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useCategories, type Locale } from '@/hooks/useCategories';

interface Props {
  value: string;           // The selected category key (Albanian key)
  onChange: (key: string) => void;
  locale: string;
  placeholder?: string;
  className?: string;
  errorClassName?: string;
  hasError?: boolean;
}

export default function JobCategoryAutocomplete({
  value,
  onChange,
  locale,
  placeholder = '',
  className = '',
  errorClassName = '',
  hasError = false,
}: Props) {
  const loc = locale as Locale;
  const { categories } = useCategories();

  // Get display label for the selected key
  const selectedLabel = useMemo(() => {
    if (!value) return '';
    for (const group of categories) {
      for (const title of group.titles) {
        if (title.key === value) return title.labels[loc] || title.labels.sq;
      }
    }
    return value;
  }, [value, loc, categories]);

  const [query, setQuery] = useState(selectedLabel);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync display when value changes externally
  useEffect(() => {
    if (!open) setQuery(selectedLabel);
  }, [selectedLabel, open]);

  // Filter categories based on query
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return categories;
    return categories.map((group) => {
      const titles = group.titles.filter((t) => {
        const label = t.labels[loc] || t.labels.sq;
        return label.toLowerCase().includes(q) || t.key.toLowerCase().includes(q);
      });
      return { ...group, titles };
    }).filter((g) => g.titles.length > 0);
  }, [query, loc, categories]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(selectedLabel);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [selectedLabel]);

  const handleSelect = (key: string) => {
    onChange(key);
    setOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={clsx(
            hasError ? errorClassName : className,
            '!pl-10 !pr-10'
          )}
        />
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        ) : (
          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        )}
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-xl z-50 max-h-[280px] overflow-y-auto">
          {filtered.map((group) => (
            <div key={group.slug}>
              <div className="px-3 py-2 text-[12px] font-bold text-[#162C66] uppercase tracking-wider bg-[#FDF6D8] sticky top-0 z-10 border-b border-[#F5C400]/20">
                {group.icon} {group.labels[loc] || group.labels.sq}
              </div>
              {group.titles.map((title) => {
                const label = title.labels[loc] || title.labels.sq;
                return (
                  <button
                    key={title.key}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(title.key); }}
                    className={clsx(
                      'w-full text-left px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-slate-50',
                      title.key === value ? 'text-[#162C66] font-semibold bg-blue-50/50' : 'text-slate-700'
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {open && filtered.length === 0 && query.trim() && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-xl z-50 px-4 py-6 text-center text-sm text-slate-400">
          {locale === 'de' ? 'Keine Ergebnisse' : locale === 'fr' ? 'Aucun résultat' : locale === 'it' ? 'Nessun risultato' : locale === 'sq' ? 'Asnjë rezultat' : 'No results'}
        </div>
      )}
    </div>
  );
}
