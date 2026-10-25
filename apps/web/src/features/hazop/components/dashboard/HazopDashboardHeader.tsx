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
    <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
      <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary shadow-sm">
              <ShieldCheck size={22} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight text-[var(--psm-text)] sm:text-2xl">
                HAZOP / PHA Management
              </h1>
              <p className="mt-0.5 text-xs text-[var(--psm-muted)] sm:text-sm">
                Enterprise view of process hazard studies, risk health, recommendations, actions, sign-offs, and revalidation readiness.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-9 min-w-[170px] items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 text-xs text-[var(--psm-muted)] sm:h-10 sm:text-sm">
            <Calendar size={14} className="shrink-0 text-primary" />
            <input
              type="date"
              className="w-full bg-transparent text-[var(--psm-text)] outline-none"
              value={filters.dateFrom}
              onChange={(event) => onFilter('dateFrom', event.target.value)}
            />
          </label>

          <label className="flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 text-xs text-[var(--psm-muted)] sm:h-10 sm:text-sm">
            <Search size={14} className="shrink-0 text-[var(--psm-muted)]" />
            <input
              className="w-full bg-transparent text-[var(--psm-text)] outline-none placeholder:text-[var(--psm-muted)]"
              placeholder="Search study number, title, unit, area, leader..."
              value={filters.search}
              onChange={(event) => onFilter('search', event.target.value)}
            />
          </label>

          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 text-xs font-semibold text-[var(--psm-text)] transition hover:bg-[var(--psm-surface)] active:scale-95 sm:h-10 sm:px-4 sm:text-sm"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>

          <Link
            href="/hazop/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90 active:scale-95 sm:h-10 sm:px-4 sm:text-sm"
          >
            <Plus size={15} />
            <span>Create HAZOP Study</span>
          </Link>

          <button
            type="button"
            onClick={onExport}
            disabled={exporting}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 text-xs font-semibold text-[var(--psm-text)] transition hover:bg-[var(--psm-surface)] disabled:opacity-50 active:scale-95 sm:h-10 sm:px-4 sm:text-sm"
          >
            <Download size={14} />
            <span>{exporting ? 'Exporting...' : 'Export'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
