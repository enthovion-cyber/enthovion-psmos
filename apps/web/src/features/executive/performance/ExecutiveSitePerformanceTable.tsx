'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Building2 } from 'lucide-react';
import type { ExecutiveScopePerformance } from '../types/executive-performance.types';
import { ExecutivePerformanceStatusBadge } from '../shared/ExecutivePerformanceStatusBadge';

interface Props {
  rows: ExecutiveScopePerformance[];
  loading?: boolean;
}

export function ExecutiveSitePerformanceTable({ rows, loading }: Props) {
  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-[var(--psm-surface-2)]" />;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-sm">
      <div className="border-b border-[var(--psm-line)] p-4 sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-[var(--psm-text)]">Site PSM Performance Benchmark</h2>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">
            Compare permitted site operations by cross-module health foundation, critical risk load, and action compliance.
          </p>
        </div>
        <span className="mt-2 inline-block rounded-full bg-[var(--psm-surface-2)] px-2.5 py-1 text-xs font-semibold text-[var(--psm-muted)] sm:mt-0">
          {rows.length} Sites Permitted
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[840px] text-left text-sm">
          <thead className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
            <tr>
              <th className="px-4 py-3">Site / Facility</th>
              <th className="px-4 py-3">PSM Score</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Data Quality</th>
              <th className="px-4 py-3">Critical Alerts</th>
              <th className="px-4 py-3">Overdue Actions</th>
              <th className="px-4 py-3">Pending Approvals</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--psm-line)]">
            {rows.map((row) => {
              const score = row.performance_score_foundation;
              return (
                <tr key={row.scope_record_id ?? row.id} className="transition-colors hover:bg-[var(--psm-surface-2)]">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-[var(--psm-primary)] shrink-0" />
                      <div>
                        <Link
                          href={`/executive/performance/sites/${row.scope_record_id}`}
                          className="font-semibold text-[var(--psm-text)] hover:text-[var(--psm-primary)] hover:underline"
                        >
                          {row.scope_label}
                        </Link>
                        <p className="text-[11px] text-[var(--psm-muted)]">ID: {row.scope_record_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-[var(--psm-line)]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(Math.max(score ?? 0, 0), 100)}%`,
                            backgroundColor:
                              (score ?? 0) >= 80 ? '#10b981' : (score ?? 0) >= 60 ? '#f59e0b' : '#ef4444',
                          }}
                        />
                      </div>
                      <span className="font-bold text-[var(--psm-text)]">{score != null ? score : '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <ExecutivePerformanceStatusBadge status={row.performance_status} />
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-medium text-[var(--psm-muted)]">{row.data_quality_status}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        row.critical_alert_count > 0
                          ? 'bg-red-500/15 text-red-700 dark:text-red-400 font-bold'
                          : 'text-[var(--psm-muted)]'
                      }`}
                    >
                      {row.critical_alert_count}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        row.overdue_action_count > 0
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                          : 'text-[var(--psm-muted)]'
                      }`}
                    >
                      {row.overdue_action_count}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-[var(--psm-muted)]">{row.pending_approval_count}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/executive/performance/sites/${row.scope_record_id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--psm-primary)] hover:underline"
                    >
                      Inspect <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!rows.length ? (
        <div className="py-12 text-center text-sm text-[var(--psm-muted)]">
          No permitted site performance records found.
        </div>
      ) : null}
    </div>
  );
}
