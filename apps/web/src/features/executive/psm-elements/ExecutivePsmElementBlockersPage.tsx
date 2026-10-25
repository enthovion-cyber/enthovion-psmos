'use client';

import React from 'react';
import { useExecutivePsmElementGaps } from '../hooks/useExecutivePsmElementGaps';
import { ExecutiveOverviewNavigation } from '../components/ExecutiveOverview';
import { ExecutiveThemeToggle } from '../components/shared/ExecutiveThemeToggle';
import { PsmGapTable } from './PsmElementShared';
import { useMyPermissions } from '@/features/iam/hooks/useIam';

export function ExecutivePsmElementBlockersPage() {
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);
  const query = useExecutivePsmElementGaps();

  // Filter for high/critical blockers
  const blockers = (query.data ?? []).filter(
    (g) => g.severity === 'critical' || g.severity === 'high' || g.gap_type.toLowerCase().includes('blocker')
  );

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-red-500">
            Executive KPI · Remediation Priorities
          </p>
          <h1 className="text-2xl font-bold text-[var(--psm-text)]">Critical Element Blockers</h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">
            High-severity process safety roadblocks requiring immediate executive escalation and operational sign-off.
          </p>
        </div>
        <ExecutiveThemeToggle />
      </header>

      {query.isLoading ? (
        <div className="h-64 animate-pulse rounded-xl bg-[var(--psm-surface-2)]" />
      ) : query.isError ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-[var(--psm-text)]">
          Could not load critical blockers.
        </div>
      ) : (
        <div className="rounded-xl border border-red-500/20 bg-[var(--psm-surface)] p-5 shadow-sm">
          <PsmGapTable gaps={blockers} />
        </div>
      )}
    </main>
  );
}
