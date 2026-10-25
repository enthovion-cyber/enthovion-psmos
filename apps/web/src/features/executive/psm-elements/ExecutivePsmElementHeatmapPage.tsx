'use client';

import React from 'react';
import { useExecutivePsmElementHeatmap } from '../hooks/useExecutivePsmElementHeatmap';
import { ExecutiveOverviewNavigation } from '../components/ExecutiveOverview';
import { ExecutivePsmElementHeatmapGrid } from './ExecutivePsmElementHeatmapGrid';
import { ExecutiveThemeToggle } from '../components/shared/ExecutiveThemeToggle';
import { useMyPermissions } from '@/features/iam/hooks/useIam';

export function ExecutivePsmElementHeatmapPage() {
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);
  const query = useExecutivePsmElementHeatmap();

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-primary)]">
            Executive KPI · Governance Matrix
          </p>
          <h1 className="text-2xl font-bold text-[var(--psm-text)]">PSM Elements Heatmap</h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">
            Core process safety health status, risk distribution, and readiness across the enterprise.
          </p>
        </div>
        <ExecutiveThemeToggle />
      </header>

      {query.isLoading ? (
        <div className="h-80 animate-pulse rounded-xl bg-[var(--psm-surface-2)]" />
      ) : query.isError || !query.data ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-[var(--psm-text)]">
          Could not load PSM element heatmap data.
        </div>
      ) : (
        <ExecutivePsmElementHeatmapGrid cells={query.data.cells ?? []} />
      )}
    </main>
  );
}
