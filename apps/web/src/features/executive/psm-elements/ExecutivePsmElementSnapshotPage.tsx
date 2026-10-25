'use client';

import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { useExecutivePsmElementSnapshots } from '../hooks/useExecutivePsmElementSnapshots';
import { ExecutiveOverviewNavigation } from '../components/ExecutiveOverview';
import { ExecutiveThemeToggle } from '../components/shared/ExecutiveThemeToggle';
import { CreatePsmElementSnapshotDialog } from './dialogs/CreatePsmElementSnapshotDialog';
import { useMyPermissions } from '@/features/iam/hooks/useIam';

export function ExecutivePsmElementSnapshotPage() {
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);
  const canCreate = granted.has('executive.psm_element.snapshot.create');
  const [open, setOpen] = useState(false);

  const query = useExecutivePsmElementSnapshots();
  const snapshots = query.data?.rows ?? [];

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-primary)]">
            Executive KPI · Governance Records
          </p>
          <h1 className="text-2xl font-bold text-[var(--psm-text)]">PSM Element Snapshots</h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">
            Immutable points-in-time capturing 20 core PSM elements, open gaps, and source telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExecutiveThemeToggle />
          {canCreate ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
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
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]">
                <tr>
                  <th className="px-4 py-3">Snapshot Title</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Scope</th>
                  <th className="px-4 py-3">Elements Count</th>
                  <th className="px-4 py-3">Healthy</th>
                  <th className="px-4 py-3">Critical</th>
                  <th className="px-4 py-3">Generated At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--psm-line)]">
                {snapshots.map((snap: any) => (
                  <tr key={snap.id ?? snap.snapshot_code} className="hover:bg-[var(--psm-surface-2)]">
                    <td className="px-4 py-3.5 font-bold text-[var(--psm-text)]">{snap.snapshot_title}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-[var(--psm-muted)]">{snap.snapshot_code ?? snap.id}</td>
                    <td className="px-4 py-3.5 uppercase text-xs font-semibold">{snap.scope_type}</td>
                    <td className="px-4 py-3.5 font-bold">{snap.element_count}</td>
                    <td className="px-4 py-3.5 text-emerald-600 font-bold">{snap.healthy_count}</td>
                    <td className="px-4 py-3.5 text-rose-600 font-bold">{snap.critical_count}</td>
                    <td className="px-4 py-3.5 text-xs text-[var(--psm-muted)]">
                      {snap.generated_at ? new Date(snap.generated_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!snapshots.length ? (
            <div className="py-12 text-center text-sm text-[var(--psm-muted)]">
              No element snapshots captured yet.
            </div>
          ) : null}
        </div>
      )}

      <CreatePsmElementSnapshotDialog open={open} onOpenChange={setOpen} />
    </main>
  );
}
