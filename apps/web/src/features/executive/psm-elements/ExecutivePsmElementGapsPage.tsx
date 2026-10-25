'use client';

import React from 'react';
import { useExecutivePsmElementGaps } from '../hooks/useExecutivePsmElementGaps';
import { ExecutiveOverviewNavigation } from '../components/ExecutiveOverview';
import { ExecutiveThemeToggle } from '../components/shared/ExecutiveThemeToggle';
import { PsmGapTable } from './PsmElementShared';
import { useMyPermissions } from '@/features/iam/hooks/useIam';

export function ExecutivePsmElementGapsPage() {
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);
  const query = useExecutivePsmElementGaps();

  const gaps = query.data ?? [];

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-primary)]">
            Executive KPI · Gap Analysis
          </p>
          <h1 className="text-2xl font-bold text-[var(--psm-text)]">PSM Element Deficiencies & Gaps</h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">
            Open findings, overdue reviews, inspection lapses, and unmitigated process hazards across all elements.
          </p>
        </div>
        <ExecutiveThemeToggle />
      </header>

      {query.isLoading ? (
        <div className="h-64 animate-pulse rounded-xl bg-[var(--psm-surface-2)]" />
      ) : query.isError ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-[var(--psm-text)]">
          Could not load PSM element gaps.
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
          <PsmGapTable gaps={gaps} />
        </div>
      )}
    </main>
  );
}
