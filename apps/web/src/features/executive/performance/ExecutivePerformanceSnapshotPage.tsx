'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Camera, Archive, Clock, ShieldCheck, Database, Calendar } from 'lucide-react';
import { executiveApi } from '../services/executive-api';
import { ExecutiveOverviewNavigation } from '../components/ExecutiveOverview';
import { ExecutivePerformanceStatusBadge } from '../shared/ExecutivePerformanceStatusBadge';
import { ExecutiveThemeToggle } from '../components/shared/ExecutiveThemeToggle';
import { CreatePerformanceSnapshotDialog } from './dialogs/CreatePerformanceSnapshotDialog';
import { useMyPermissions } from '@/features/iam/hooks/useIam';

export function ExecutivePerformanceSnapshotPage() {
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);
  const canCreate = granted.has('executive.performance.snapshot.create');
  const [createOpen, setCreateOpen] = useState(false);

  const query = useQuery({
    queryKey: ['executive', 'performance', 'snapshots'],
    queryFn: () => executiveApi.performanceSnapshots(),
  });

  const snapshots = query.data?.rows ?? [];

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-primary)]">
            Executive KPI · Audit Records
          </p>
          <h1 className="text-2xl font-bold text-[var(--psm-text)]">Performance Snapshots</h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">
            Immutable, audit-ready performance snapshots captured at points in time for governance and reporting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExecutiveThemeToggle />
          {canCreate ? (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--psm-primary)] px-3.5 py-2 text-sm font-semibold text-white shadow hover:opacity-90"
            >
              <Camera className="h-4 w-4" />
              Capture Snapshot
            </button>
          ) : null}
        </div>
      </header>

      {query.isLoading ? (
        <div className="h-64 animate-pulse rounded-xl bg-[var(--psm-surface-2)]" />
      ) : query.isError || !query.data ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-[var(--psm-text)]">
          Could not load performance snapshot history.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
                <tr>
                  <th className="px-4 py-3">Snapshot Title & Code</th>
                  <th className="px-4 py-3">Scope & Level</th>
                  <th className="px-4 py-3">Captured Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Captured By / At</th>
                  <th className="px-4 py-3">Run ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--psm-line)]">
                {snapshots.map((row: any) => (
                  <tr key={row.id ?? row.snapshot_code} className="hover:bg-[var(--psm-surface-2)]">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-[var(--psm-text)]">{row.snapshot_title}</div>
                      <div className="font-mono text-xs text-[var(--psm-muted)]">{row.snapshot_code ?? row.id}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded bg-[var(--psm-surface-2)] px-2 py-0.5 text-xs font-semibold uppercase text-[var(--psm-muted)]">
                        {row.scope_type ?? 'Company'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-base text-[var(--psm-text)]">
                      {row.performance_score_foundation != null ? `${row.performance_score_foundation}/100` : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <ExecutivePerformanceStatusBadge status={row.performance_status ?? 'Healthy'} />
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[var(--psm-muted)]">
                      <div>{row.generated_by ?? 'System'}</div>
                      <div>{row.generated_at ? new Date(row.generated_at).toLocaleString() : '—'}</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-[var(--psm-muted)]">
                      {row.aggregation_run_id ? String(row.aggregation_run_id).substring(0, 8) : 'Manual'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!snapshots.length ? (
            <div className="py-12 text-center text-sm text-[var(--psm-muted)]">
              No performance snapshots captured yet.
            </div>
          ) : null}
        </div>
      )}

      <CreatePerformanceSnapshotDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </main>
  );
}
