'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { executiveApi } from '../services/executive-api';
import { ExecutiveOverviewNavigation } from '../components/ExecutiveOverview';
import { ExecutivePerformanceHeatmapGrid } from './ExecutivePerformanceHeatmapGrid';
import { ExecutiveThemeToggle } from '../components/shared/ExecutiveThemeToggle';
import { useMyPermissions } from '@/features/iam/hooks/useIam';

export function ExecutivePerformanceHeatmapPage() {
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);

  const heatmapQuery = useQuery({
    queryKey: ['executive', 'performance', 'heatmap'],
    queryFn: () => executiveApi.performanceHeatmap({ scopeType: 'site' }),
  });

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-primary)]">
            Executive KPI · Heatmap Matrix
          </p>
          <h1 className="text-2xl font-bold text-[var(--psm-text)]">Performance Heatmap</h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">
            Multi-dimensional risk, compliance, and operational health density matrix across all permitted facilities.
          </p>
        </div>
        <ExecutiveThemeToggle />
      </header>

      {heatmapQuery.isLoading ? (
        <div className="h-80 animate-pulse rounded-xl bg-[var(--psm-surface-2)]" />
      ) : heatmapQuery.isError || !heatmapQuery.data ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-[var(--psm-text)]">
          Could not load performance heatmap data. Verify your executive permissions.
        </div>
      ) : (
        <ExecutivePerformanceHeatmapGrid cells={heatmapQuery.data.cells ?? []} />
      )}
    </main>
  );
}
