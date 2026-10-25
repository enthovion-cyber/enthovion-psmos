'use client';

import Link from 'next/link';
import { Filter, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { usePermits } from '../hooks/usePtw';
import { PermitStatusBadge, PermitTypeBadge } from './PermitBadges';

export function PermitSidebarList({ selectedId }: { selectedId: string }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const query = usePermits({ limit: '50' });

  const permits = useMemo(() => {
    const term = search.toLowerCase().trim();
    return (query.data ?? []).filter((permit) => {
      const matchesTerm =
        !term ||
        [permit.permit_number, permit.title, permit.equipment_tag, permit.job_area]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      const matchesStatus = !status || permit.status === status;
      return matchesTerm && matchesStatus;
    });
  }, [query.data, search, status]);

  return (
    <aside className="sticky top-4 flex h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0c1829] shadow-xs dark:shadow-xl">
      {/* Header & Filter Controls */}
      <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-800 p-3 bg-white/95 dark:bg-[#0c1829]/95 backdrop-blur-md z-10">
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Permits
            </h2>
            <p className="mt-0.5 text-[11px] font-medium text-slate-400">
              {permits.length} matching
            </p>
          </div>
          <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <Filter size={13} className="text-slate-500 dark:text-slate-400" />
          </div>
        </div>

        {/* Search Input */}
        <label className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs focus-within:ring-1 focus-within:ring-primary/40 focus-within:border-primary/50 transition-all duration-200">
          <Search size={13} className="text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-transparent outline-none placeholder:text-slate-400 text-xs font-medium text-slate-800 dark:text-slate-200"
            placeholder="Search permit, equipment..."
          />
        </label>

        {/* Status Dropdown */}
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none cursor-pointer focus:ring-1 focus:ring-primary/40 focus:border-primary/50 transition-all duration-200"
        >
          <option value="">All statuses</option>
          {[
            'Draft',
            'Submitted',
            'Approved',
            'Issued',
            'Active',
            'Suspended',
            'Extended',
            'Closed',
            'Cancelled',
          ].map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {/* Scrollable Container with Custom Modern Scrollbar Design */}
      <div 
        className="flex-1 overflow-y-auto p-2.5 space-y-2
          [&::-webkit-scrollbar]:w-1.5 
          [&::-webkit-scrollbar-track]:bg-transparent 
          [&::-webkit-scrollbar-thumb]:rounded-full 
          [&::-webkit-scrollbar-thumb]:bg-[var(--psm-line)]
          hover:[&::-webkit-scrollbar-thumb]:bg-[var(--psm-muted)]/30 
          transition-colors duration-150"
      >
        {query.isLoading && (
          <div className="p-4 text-center text-xs font-medium text-[var(--psm-muted)] animate-pulse">
            Loading permits...
          </div>
        )}
        
        {!query.isLoading && !permits.length && (
          <div className="p-6 text-center text-xs font-medium text-[var(--psm-muted)] bg-[var(--psm-surface-2)]/40 rounded-lg border border-dashed border-[var(--psm-line)]">
            No permits match the current filters.
          </div>
        )}

        {permits.map((permit) => {
          const isSelected = permit.id === selectedId;
          return (
            <Link
              key={permit.id}
              href={`/ptw/${permit.id}`}
              className={`block rounded-lg border p-3 transition-all duration-200 group relative
                ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                    : 'border-transparent hover:border-[var(--psm-line)] hover:bg-[var(--psm-surface-2)]/60'
                }`}
            >
              {/* Subtle indicator bar for selected item */}
              {isSelected && (
                <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-primary rounded-r" />
              )}
              
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors duration-150">
                    {permit.permit_number}
                  </div>
                  <div className="mt-1 truncate text-xs text-[var(--psm-muted)] font-medium">
                    {permit.job_area ?? permit.area?.name ?? '-'}
                    <span className="mx-1.5 opacity-40">•</span>
                    {permit.equipment_tag ?? '-'}
                  </div>
                </div>
                <div className="shrink-0 scale-95 origin-top-right">
                  <PermitStatusBadge status={permit.status} />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--psm-line)]/30 pt-2.5">
                <PermitTypeBadge type={permit.permit_type} />
                <span className="text-[11px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-warning/10 text-warning">
                  {timeUntil(permit.planned_end_at)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

function timeUntil(value: string) {
  const ms = new Date(value).getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return hours > 24 ? `${Math.floor(hours / 24)}d ${hours % 24}h` : `${hours}h ${minutes}m`;
}