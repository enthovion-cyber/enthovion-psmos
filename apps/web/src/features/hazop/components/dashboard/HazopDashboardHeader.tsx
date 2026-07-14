'use client';

import Link from 'next/link';
import { Calendar, Download, Plus, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import type { HazopDashboardFilters } from '../../types/hazop-dashboard.types';

export function HazopDashboardHeader({
  filters,
  onFilter,
  onExport,
  onRefresh,
  exporting,
}: {
  filters: HazopDashboardFilters;
  onFilter: <K extends keyof HazopDashboardFilters>(key: K, value: HazopDashboardFilters[K]) => void;
  onExport: () => void;
  onRefresh: () => void;
  exporting?: boolean;
}) {
  return (
    <header className="rounded-xl border border-[var(--psm-line)] bg-[linear-gradient(135deg,rgba(15,23,42,.95),rgba(7,18,32,.98))] p-4 shadow-2xl shadow-black/20">
      <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/15 text-blue-200">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">HAZOP / PHA Management</h1>
              <p className="mt-1 text-sm text-[var(--psm-muted)]">Enterprise view of process hazard studies, risk health, recommendations, actions, sign-offs, and revalidation readiness.</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-10 min-w-[210px] items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 text-sm text-[var(--psm-muted)]">
            <Calendar size={15} />
            <input type="date" className="w-full bg-transparent text-[var(--psm-text)] outline-none" value={filters.dateFrom} onChange={(event) => onFilter('dateFrom', event.target.value)} />
          </label>
          <label className="flex h-10 min-w-[250px] flex-1 items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 text-sm text-[var(--psm-muted)]">
            <Search size={15} />
            <input className="w-full bg-transparent text-[var(--psm-text)] outline-none placeholder:text-[var(--psm-muted)]" placeholder="Search study number, title, unit, area, leader..." value={filters.search} onChange={(event) => onFilter('search', event.target.value)} />
          </label>
          <button type="button" onClick={onRefresh} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--psm-line)] px-4 text-sm font-semibold hover:bg-[var(--psm-surface-2)]">
            <RefreshCw size={15} /> Refresh
          </button>
          <Link href="/hazop/new" className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 hover:bg-blue-500">
            <Plus size={16} /> Create HAZOP Study
          </Link>
          <button type="button" onClick={onExport} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--psm-line)] px-4 text-sm font-semibold hover:bg-[var(--psm-surface-2)]">
            <Download size={15} /> {exporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </header>
  );
}
