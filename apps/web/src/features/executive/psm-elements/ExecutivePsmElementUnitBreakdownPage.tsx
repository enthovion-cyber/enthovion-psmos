'use client';

import React from 'react';
import Link from 'next/link';
import { Layers, ArrowRight } from 'lucide-react';
import { useExecutivePsmElementBreakdown } from '../hooks/useExecutivePsmElementBreakdown';
import { ExecutiveOverviewNavigation } from '../components/ExecutiveOverview';
import { ExecutiveThemeToggle } from '../components/shared/ExecutiveThemeToggle';
import { useMyPermissions } from '@/features/iam/hooks/useIam';

interface Props {
  unitId?: string;
}

export function ExecutivePsmElementUnitBreakdownPage({ unitId }: Props) {
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);
  const query = useExecutivePsmElementBreakdown('unit', unitId ? { unitId } : undefined);

  const rows = (query.data as any[]) ?? [];

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-primary)]">
            Executive KPI · Operating Units
          </p>
          <h1 className="text-2xl font-bold text-[var(--psm-text)]">Unit PSM Element Breakdown</h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">
            Evaluate process safety compliance, critical equipment barriers, and element gaps by process unit.
          </p>
        </div>
        <ExecutiveThemeToggle />
      </header>

      {query.isLoading ? (
        <div className="h-72 animate-pulse rounded-xl bg-[var(--psm-surface-2)]" />
      ) : query.isError ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-[var(--psm-text)]">
          Could not load operating unit element breakdown.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm transition hover:border-[var(--psm-primary)]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[var(--psm-text)]">{row.label}</h3>
                    <p className="text-xs text-[var(--psm-muted)]">Unit ID: {row.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-[var(--psm-text)]">
                    {row.overallScore != null ? `${row.overallScore}/100` : '—'}
                  </span>
                  <div className="text-[10px] uppercase font-semibold text-[var(--psm-muted)]">Unit Health</div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[var(--psm-line)] pt-3 text-xs">
                <div>
                  <span className="text-[var(--psm-muted)]">Strongest Element</span>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 truncate">
                    {row.strongestElement ?? '—'}
                  </div>
                </div>
                <div>
                  <span className="text-[var(--psm-muted)]">Weakest Element</span>
                  <div className="font-bold text-rose-600 dark:text-rose-400 truncate">
                    {row.weakestElement ?? '—'}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[var(--psm-line)] pt-3 text-xs">
                <span className="text-[var(--psm-muted)]">
                  Critical Elements: <b className="text-[var(--psm-text)]">{row.criticalElementCount ?? 0}</b>
                </span>
                <Link
                  href={`/executive/performance/units/${row.id}`}
                  className="inline-flex items-center gap-1 font-semibold text-[var(--psm-primary)] hover:underline"
                >
                  Inspect Unit <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
