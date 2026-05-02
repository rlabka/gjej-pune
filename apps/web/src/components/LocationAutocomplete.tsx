'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { useLocationAutocomplete, type LocationSuggestion } from '@/hooks/useLocationAutocomplete';
import { useLocale } from 'next-intl';
import { clsx } from 'clsx';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: LocationSuggestion) => void;
  placeholder?: string;
  className?: string;
  iconClassName?: string;
  inputClassName?: string;
  showIcon?: boolean;
  iconSize?: number;
  requireSelection?: boolean;
}

export default function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Stadt oder Region',
  className = '',
  iconClassName = 'text-slate-400',
  inputClassName = '',
  showIcon = true,
  iconSize = 18,
  requireSelection = false,
}: Props) {
  const locale = useLocale();
  const { query, setQuery, suggestions, loading, clear } = useLocationAutocomplete(locale);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedRef = useRef(false);

  // Sync external value → internal query
  useEffect(() => {
    setQuery(value);
  }, [value, setQuery]);

  // Open dropdown when suggestions arrive
  useEffect(() => {
    if (suggestions.length > 0 && document.activeElement === inputRef.current) {
      setOpen(true);
      setActiveIndex(-1);
    } else if (suggestions.length === 0) {
      setOpen(false);
    }
  }, [suggestions]);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    selectedRef.current = false;
    onChange(val);
    setQuery(val);
  }, [onChange, setQuery]);

  const handleSelect = useCallback((suggestion: LocationSuggestion) => {
    selectedRef.current = true;
    clear();
    setOpen(false);
    // Let parent decide the display value via onSelect → value prop
    if (onSelect) {
      onSelect(suggestion);
    } else {
      onChange(suggestion.label);
      setQuery(suggestion.label);
    }
    inputRef.current?.blur();
  }, [onChange, setQuery, clear, onSelect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }, [open, suggestions, activeIndex, handleSelect]);

  const handleFocus = useCallback(() => {
    if (suggestions.length > 0) setOpen(true);
  }, [suggestions]);

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setOpen(false);
      // If requireSelection is on and user didn't pick from the list, clear the field
      if (requireSelection && !selectedRef.current) {
        onChange('');
        setQuery('');
      }
    }, 200);
  }, [requireSelection, onChange, setQuery]);

  return (
    <div ref={wrapperRef} className={clsx('relative', className)}>
      {showIcon && (
        <MapPin
          size={iconSize}
          className={clsx('absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10', iconClassName)}
        />
      )}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={clsx(inputClassName, showIcon && '!pl-10')}
        autoComplete="off"
      />
      {loading && (
        <Loader2
          size={14}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin pointer-events-none z-10"
        />
      )}

      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden max-h-[240px] overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={s.label + i}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
              onMouseEnter={() => setActiveIndex(i)}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors text-[13px]',
                i === activeIndex ? 'bg-slate-50' : 'hover:bg-slate-50'
              )}
            >
              <MapPin size={14} className="text-slate-400 shrink-0" />
              <div className="min-w-0 flex items-center gap-2">
                <div>
                  <span className="font-semibold text-slate-800">{s.city}</span>
                  {(s.state || s.country) && (
                    <span className="text-slate-400 ml-1">
                      — {[s.state, s.country].filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>
                {s.countryCode && (
                  <img
                    src={`https://flagcdn.com/20x15/${s.countryCode.toLowerCase()}.png`}
                    alt={s.countryCode}
                    className="w-5 h-[15px] rounded-[2px] shrink-0 object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
