'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { executiveApi } from '../services/executive-api';
import { ExecutiveOverviewNavigation } from '../components/ExecutiveOverview';
import { ExecutiveThemeToggle } from '../components/shared/ExecutiveThemeToggle';
import { ExecutivePerformanceStatusBadge } from '../shared/ExecutivePerformanceStatusBadge';
import { useMyPermissions } from '@/features/iam/hooks/useIam';

interface Props {
  equipmentId?: string;
}

export function ExecutiveEquipmentPerformancePage({ equipmentId }: Props) {
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);

  const query = useQuery<any>({
    queryKey: ['executive', 'performance', 'equipment', equipmentId],
    queryFn: () =>
      equipmentId
        ? executiveApi.performanceScope('equipment', equipmentId)
        : executiveApi.performanceScopes('equipment'),
  });

  const isList = !equipmentId;
  const listRows = isList ? (query.data as any)?.rows ?? [] : [];
  const scope = !isList ? (query.data as any) : null;

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-primary)]">
            Executive KPI · Critical Equipment
          </p>
          <h1 className="text-2xl font-bold text-[var(--psm-text)]">
            {isList ? 'Critical Equipment Health Directory' : scope?.scope_label ?? 'Equipment Performance'}
          </h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">
            Safety-critical equipment integrity, inspection schedules, relief valves, and barrier health.
          </p>
        </div>
        <ExecutiveThemeToggle />
      </header>

      {query.isLoading ? (
        <div className="h-64 animate-pulse rounded-xl bg-[var(--psm-surface-2)]" />
      ) : isList ? (
        <div className="overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]">
              <tr>
                <th className="px-4 py-3">Equipment Tag</th>
                <th className="px-4 py-3">Integrity Score</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Critical Alerts</th>
                <th className="px-4 py-3">Overdue Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--psm-line)]">
              {listRows.map((row: any) => (
                <tr key={row.scope_record_id ?? row.id} className="hover:bg-[var(--psm-surface-2)]">
                  <td className="px-4 py-3.5 font-bold text-[var(--psm-text)]">{row.scope_label}</td>
                  <td className="px-4 py-3.5 font-bold text-[var(--psm-text)]">
                    {row.performance_score_foundation != null ? `${row.performance_score_foundation}/100` : '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    <ExecutivePerformanceStatusBadge status={row.performance_status ?? 'Healthy'} />
                  </td>
                  <td className="px-4 py-3.5 text-xs">{row.critical_alert_count ?? 0}</td>
                  <td className="px-4 py-3.5 text-xs">{row.overdue_action_count ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!listRows.length ? (
            <div className="py-12 text-center text-sm text-[var(--psm-muted)]">
              No equipment performance records found.
            </div>
          ) : null}
        </div>
      ) : scope ? (
        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
          <h2 className="text-lg font-bold text-[var(--psm-text)]">{scope.scope_label}</h2>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">Equipment ID: {scope.scope_record_id}</p>
        </div>
      ) : null}
    </main>
  );
}
