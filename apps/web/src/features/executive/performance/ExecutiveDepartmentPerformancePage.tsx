'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import { executiveApi } from '../services/executive-api';
import { ExecutiveOverviewNavigation } from '../components/ExecutiveOverview';
import { ExecutiveThemeToggle } from '../components/shared/ExecutiveThemeToggle';
import { ExecutivePerformanceStatusBadge } from '../shared/ExecutivePerformanceStatusBadge';
import { useMyPermissions } from '@/features/iam/hooks/useIam';

interface Props {
  departmentId?: string;
}

export function ExecutiveDepartmentPerformancePage({ departmentId }: Props) {
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);

  const query = useQuery<any>({
    queryKey: ['executive', 'performance', 'department', departmentId],
    queryFn: () =>
      departmentId
        ? executiveApi.performanceScope('department', departmentId)
        : executiveApi.performanceScopes('department'),
  });

  const isList = !departmentId;
  const listRows = isList ? (query.data as any)?.rows ?? [] : [];
  const scope = !isList ? (query.data as any) : null;

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-primary)]">
            Executive KPI · Organization
          </p>
          <h1 className="text-2xl font-bold text-[var(--psm-text)]">
            {isList ? 'Department Performance Directory' : scope?.scope_label ?? 'Department Performance'}
          </h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">
            Action ownership, approval velocity, training compliance, and PSM accountability by department.
          </p>
        </div>
        <ExecutiveThemeToggle />
      </header>

      {query.isLoading ? (
        <div className="h-64 animate-pulse rounded-xl bg-[var(--psm-surface-2)]" />
      ) : query.isError ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-[var(--psm-text)]">
          Could not load department performance data.
        </div>
      ) : isList ? (
        <div className="overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
                <tr>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">PSM Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Critical Alerts</th>
                  <th className="px-4 py-3">Overdue Actions</th>
                  <th className="px-4 py-3">Pending Reviews</th>
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
                    <td className="px-4 py-3.5 text-xs">{row.pending_approval_count ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!listRows.length ? (
            <div className="py-12 text-center text-sm text-[var(--psm-muted)]">
              No department performance records found.
            </div>
          ) : null}
        </div>
      ) : scope ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
            <h2 className="text-lg font-bold text-[var(--psm-text)]">Department PSM Overview</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg bg-[var(--psm-surface-2)] p-3">
                <span className="text-xs text-[var(--psm-muted)]">Score</span>
                <p className="mt-1 text-2xl font-black text-[var(--psm-text)]">
                  {scope.performance_score_foundation ?? '—'}
                </p>
              </div>
              <div className="rounded-lg bg-[var(--psm-surface-2)] p-3">
                <span className="text-xs text-[var(--psm-muted)]">Alerts</span>
                <p className="mt-1 text-2xl font-black text-rose-500">{scope.critical_alert_count ?? 0}</p>
              </div>
              <div className="rounded-lg bg-[var(--psm-surface-2)] p-3">
                <span className="text-xs text-[var(--psm-muted)]">Overdue</span>
                <p className="mt-1 text-2xl font-black text-amber-500">{scope.overdue_action_count ?? 0}</p>
              </div>
              <div className="rounded-lg bg-[var(--psm-surface-2)] p-3">
                <span className="text-xs text-[var(--psm-muted)]">Pending</span>
                <p className="mt-1 text-2xl font-black text-[var(--psm-text)]">{scope.pending_approval_count ?? 0}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
