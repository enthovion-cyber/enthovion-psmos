'use client';

import { RefreshCw, Camera } from 'lucide-react';
import type { ExecutiveDashboard, ExecutiveSitePerformance } from '../types/executive-kpi.types';
import { ExecutiveStatusBadge } from './shared/ExecutiveStatusBadge';
import { ExecutiveThemeToggle } from './shared/ExecutiveThemeToggle';

export function ExecutiveDashboardHeader({
  header,
  sites,
  refreshing,
  snapshotting,
  canRefresh,
  canCreateSnapshot,
  onRefresh,
  onSnapshot,
  onSiteChange,
}: {
  header: ExecutiveDashboard['header'];
  sites: ExecutiveSitePerformance[];
  refreshing: boolean;
  snapshotting: boolean;
  canRefresh: boolean;
  canCreateSnapshot: boolean;
  onRefresh: () => void;
  onSnapshot: () => void;
  onSiteChange: (siteId: string | null) => void;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-[var(--psm-line)] pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-primary)]">
          PSM Health Cockpit
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-[var(--psm-text)]">Executive Dashboard</h1>
          <ExecutiveStatusBadge status={header.status} />
        </div>
        <p className="mt-2 max-w-3xl text-sm text-[var(--psm-muted)]">
          Company-level operational intelligence from permitted module data. {header.reason}
        </p>
        <label className="mt-3 block w-full max-w-xs text-xs font-semibold text-[var(--psm-muted)]">
          Scope
          <select
            value={header.selectedSiteId ?? ''}
            onChange={(event) => onSiteChange(event.target.value || null)}
            className="mt-1 block w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-2 text-sm font-medium text-[var(--psm-text)]"
          >
            <option value="">Company - all permitted sites</option>
            {sites.map((site) => (
              <option key={site.siteId} value={site.siteId}>
                {site.siteName}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ExecutiveThemeToggle />
        {canRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            title={
              refreshing
                ? 'KPI refresh is in progress.'
                : 'Recalculate permitted KPI results from source modules.'
            }
            className="inline-flex items-center gap-2 rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-2 text-sm font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        ) : null}
        {canCreateSnapshot ? (
          <button
            type="button"
            onClick={onSnapshot}
            disabled={snapshotting}
            title={
              snapshotting
                ? 'Snapshot creation is in progress.'
                : 'Capture an immutable KPI snapshot for this scope.'
            }
            className="inline-flex items-center gap-2 rounded-md bg-[var(--psm-primary)] px-3 py-2 text-sm font-semibold text-white shadow hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Camera size={16} />
            Create snapshot
          </button>
        ) : null}
      </div>
    </header>
  );
}
