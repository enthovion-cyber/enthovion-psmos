'use client';

import React from 'react';
import { RefreshCw, Camera, Layers } from 'lucide-react';
import type { ExecutiveScopePerformance } from '../types/executive-performance.types';
import { ExecutivePerformanceStatusBadge } from '../shared/ExecutivePerformanceStatusBadge';
import { ExecutiveThemeToggle } from '../components/shared/ExecutiveThemeToggle';

interface Props {
  scope: ExecutiveScopePerformance;
  onRefresh?: () => void;
  onSnapshot?: () => void;
  refreshing?: boolean;
  snapshotting?: boolean;
}

export function ExecutiveUnitPerformanceHeader({
  scope,
  onRefresh,
  onSnapshot,
  refreshing = false,
  snapshotting = false,
}: Props) {
  const score = scope.performance_score_foundation;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 shrink-0">
          <Layers className="h-6 w-6" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--psm-text)]">{scope.scope_label}</h1>
            <ExecutivePerformanceStatusBadge status={scope.performance_status} />
          </div>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">
            Operating Unit ID: <code className="rounded bg-[var(--psm-surface-2)] px-1 py-0.5">{scope.scope_record_id}</code>
            {' · '}Data Quality: <span className="font-semibold text-[var(--psm-text)]">{scope.data_quality_status}</span>
            {scope.calculated_at ? ` · Last calculated ${new Date(scope.calculated_at).toLocaleTimeString()}` : ''}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-1.5 text-center">
          <span className="text-xs uppercase tracking-wider text-[var(--psm-muted)]">Unit Health</span>
          <span className="text-lg font-bold text-[var(--psm-text)]">{score != null ? `${score}/100` : '—'}</span>
        </div>

        <ExecutiveThemeToggle />

        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-2 text-sm font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)] disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Recalculate
          </button>
        ) : null}

        {onSnapshot ? (
          <button
            type="button"
            onClick={onSnapshot}
            disabled={snapshotting || !scope.aggregation_run_id}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--psm-primary)] px-3 py-2 text-sm font-semibold text-white shadow hover:opacity-90 disabled:opacity-60"
          >
            <Camera className="h-4 w-4" />
            Snapshot
          </button>
        ) : null}
      </div>
    </div>
  );
}
