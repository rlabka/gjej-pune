'use client';

import { PIPELINE_STATUSES, type Applicant, type PipelineStatus } from './types';
import { ChevronDown, Search, Filter, Check, X, LayoutList, Kanban, ArrowUpDown } from 'lucide-react';
import { clsx } from 'clsx';
import { useState, useRef, useEffect } from 'react';

export type SortOption = 'newest' | 'oldest' | 'name_asc' | 'name_desc';

type Props = {
  query: string;
  setQuery: (value: string) => void;
  selectedStatuses: PipelineStatus[]; // empty => all
  setSelectedStatuses: (value: PipelineStatus[]) => void;
  jobFilter: Applicant['jobKey'] | 'all';
  setJobFilter: (value: Applicant['jobKey'] | 'all') => void;
  focusMode: boolean;
  setFocusMode: (value: boolean) => void;
  viewMode: 'list' | 'board';
  setViewMode: (mode: 'list' | 'board') => void;
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
  stageLabel: (status: PipelineStatus) => string;
  jobLabel: (key: Applicant['jobKey']) => string;
  jobKeys: Applicant['jobKey'][];
  t: (key: string, values?: Record<string, any>) => string;
};

function toggleInList<T extends string>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

export default function PipelineFiltersBar({
  query,
  setQuery,
  selectedStatuses,
  setSelectedStatuses,
  jobFilter,
  setJobFilter,
  focusMode,
  setFocusMode,
  viewMode,
  setViewMode,
  sortOption,
  setSortOption,
  stageLabel,
  jobLabel,
  jobKeys,
  t
}: Props) {
  const [activeDropdown, setActiveDropdown] = useState<'status' | 'job' | 'sort' | null>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCount = selectedStatuses.length;

  const sortLabels: Record<SortOption, string> = {
    newest: t('filters.sortNewest'),
    oldest: t('filters.sortOldest'),
    name_asc: t('filters.sortNameAsc'),
    name_desc: t('filters.sortNameDesc'),
  };

  return (
    <div ref={filtersRef} className="sticky top-0 z-40 flex flex-col lg:flex-row gap-4 mb-6 bg-[#F7F7F7] py-4 -mx-4 px-4 lg:-mx-10 lg:px-10 border-b border-slate-200/50 backdrop-blur-sm bg-[#F7F7F7]/90 transition-all items-center justify-between">
      
      <div className="flex items-center gap-3 flex-1 w-full lg:w-auto">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 h-11 bg-white border border-slate-200 rounded-full text-sm font-medium text-[#0B1F44] focus:ring-2 focus:ring-[#162C66]/10 focus:border-[#162C66] outline-none transition-all placeholder:text-slate-400 shadow-sm"
            aria-label={t('filters.searchLabel')}
          />
        </div>

        {/* Status Filter (Only in Board View) */}
        {viewMode === 'board' && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'status' ? null : 'status')}
              className={clsx(
                'flex items-center gap-2 px-4 h-11 rounded-full text-sm font-bold border transition-all whitespace-nowrap shadow-sm',
                selectedCount > 0 || activeDropdown === 'status'
                  ? 'bg-[#162C66] border-[#162C66] text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              <Filter size={16} />
              <span className="hidden sm:inline">
                {selectedCount === 0 ? t('filters.statusLabel') : t('filters.statusSelected', { count: selectedCount })}
              </span>
              <ChevronDown size={14} className={clsx('transition-transform', activeDropdown === 'status' && 'rotate-180')} />
            </button>

            {activeDropdown === 'status' && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {t('filters.statusLabel')}
                </div>
                <div className="space-y-1">
                  {PIPELINE_STATUSES.map((s) => (
                    <label key={s} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedStatuses.includes(s)}
                          onChange={() => setSelectedStatuses(toggleInList(selectedStatuses, s))}
                          className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-md checked:bg-[#162C66] checked:border-[#162C66] transition-all"
                        />
                        <Check size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 group-hover:text-[#162C66] transition-colors">
                        {stageLabel(s)}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="border-t border-slate-100 mt-2 pt-2 px-3 pb-1 flex justify-between items-center">
                  <button
                    onClick={() => setSelectedStatuses([])}
                    className="text-xs font-bold text-slate-500 hover:text-[#162C66]"
                  >
                    {t('filters.clear')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Job Filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActiveDropdown(activeDropdown === 'job' ? null : 'job')}
            className={clsx(
              'flex items-center gap-2 px-4 h-11 rounded-full text-sm font-bold border transition-all whitespace-nowrap shadow-sm max-w-[200px]',
              jobFilter !== 'all' || activeDropdown === 'job'
                ? 'bg-[#162C66]/5 border-[#162C66] text-[#162C66]'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            )}
          >
            <span className="truncate">
              {jobFilter === 'all' ? t('filters.jobAll') : jobLabel(jobFilter)}
            </span>
            <ChevronDown size={14} className={clsx('shrink-0 transition-transform', activeDropdown === 'job' && 'rotate-180')} />
          </button>

          {activeDropdown === 'job' && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200 max-h-[300px] overflow-y-auto">
              <button
                onClick={() => {
                  setJobFilter('all');
                  setActiveDropdown(null);
                }}
                className={clsx(
                  'w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between',
                  jobFilter === 'all' ? 'bg-slate-50 text-[#162C66]' : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                {t('filters.jobAll')}
                {jobFilter === 'all' && <Check size={16} />}
              </button>
              {jobKeys.map((k) => (
                <button
                  key={k}
                  onClick={() => {
                    setJobFilter(k);
                    setActiveDropdown(null);
                  }}
                  className={clsx(
                    'w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between',
                    jobFilter === k ? 'bg-slate-50 text-[#162C66]' : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <span className="truncate">{jobLabel(k)}</span>
                  {jobFilter === k && <Check size={16} className="shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Sort Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActiveDropdown(activeDropdown === 'sort' ? null : 'sort')}
            className={clsx(
              'flex items-center gap-2 px-4 h-11 rounded-full text-sm font-bold border transition-all whitespace-nowrap shadow-sm',
              activeDropdown === 'sort'
                ? 'bg-[#162C66] border-[#162C66] text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            )}
          >
            <ArrowUpDown size={16} />
            <span className="hidden sm:inline">
              {t('filters.sortBy')}: {sortLabels[sortOption]}
            </span>
            <ChevronDown size={14} className={clsx('transition-transform', activeDropdown === 'sort' && 'rotate-180')} />
          </button>

          {activeDropdown === 'sort' && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="space-y-1">
                {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setSortOption(option);
                      setActiveDropdown(null);
                    }}
                    className={clsx(
                      'w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between',
                      sortOption === option ? 'bg-slate-50 text-[#162C66]' : 'text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    {sortLabels[option]}
                    {sortOption === option && <Check size={16} />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Focus Mode Toggle (Only Board) */}
        {viewMode === 'board' && (
          <button
            type="button"
            onClick={() => setFocusMode(!focusMode)}
            className={clsx(
              'flex items-center gap-2 px-4 h-11 rounded-full text-sm font-bold border transition-all whitespace-nowrap shadow-sm',
              focusMode
                ? 'bg-[#F5C400] border-[#F5C400] text-[#162C66]'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            )}
            title={t('filters.focusModeLabel')}
          >
            {focusMode ? t('filters.focusModeOn') : t('filters.focusModeOff')}
          </button>
        )}

        {/* View Toggle */}
        <div className="flex items-center bg-white border border-slate-200 rounded-full p-1 h-11 shadow-sm">
          <button
            onClick={() => setViewMode('list')}
            className={clsx(
              'p-2 rounded-full transition-all',
              viewMode === 'list' ? 'bg-[#162C66] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
            )}
            title="List View"
          >
            <LayoutList size={18} />
          </button>
          <button
            onClick={() => setViewMode('board')}
            className={clsx(
              'p-2 rounded-full transition-all',
              viewMode === 'board' ? 'bg-[#162C66] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
            )}
            title="Board View"
          >
            <Kanban size={18} />
          </button>
        </div>

        {/* Reset */}
        {(query || selectedStatuses.length > 0 || jobFilter !== 'all' || focusMode) && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSelectedStatuses([]);
              setJobFilter('all');
              setFocusMode(false);
              setSortOption('newest');
            }}
            className="flex items-center justify-center w-11 h-11 rounded-full border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all"
            title={t('filters.reset')}
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
