'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ListChecks } from 'lucide-react';
import type { PsmElementRow } from '../types/executive-psm-element.types';
import { ExecutivePsmElementStatusBadge } from '../shared/ExecutivePsmElementStatusBadge';
import { ExecutivePsmElementCategoryBadge } from '../shared/ExecutivePsmElementCategoryBadge';

interface Props {
  rows: PsmElementRow[];
  loading?: boolean;
}

export function ExecutivePsmElementTable({ rows, loading }: Props) {
  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-[var(--psm-surface-2)]" />;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-sm">
      <div className="border-b border-[var(--psm-line)] p-4 sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-[var(--psm-text)]">PSM Elements Governance Register</h2>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">
            Core process safety management elements evaluated against operational evidence and module telemetry.
          </p>
        </div>
        <span className="mt-2 inline-block rounded-full bg-[var(--psm-surface-2)] px-2.5 py-1 text-xs font-semibold text-[var(--psm-muted)] sm:mt-0">
          {rows.length} Elements Configured
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[840px] text-left text-sm">
          <thead className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
            <tr>
              <th className="px-4 py-3">Element</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Critical Gaps</th>
              <th className="px-4 py-3">Overdue Actions</th>
              <th className="px-4 py-3">Missing Evidence</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--psm-line)]">
            {rows.map((row) => {
              const score = row.score_value;
              return (
                <tr key={row.id ?? row.element_code} className="transition-colors hover:bg-[var(--psm-surface-2)]">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <ListChecks className="h-4 w-4 text-[var(--psm-primary)] shrink-0" />
                      <div>
                        <Link
                          href={`/executive/psm-elements/${row.id}`}
                          className="font-semibold text-[var(--psm-text)] hover:text-[var(--psm-primary)] hover:underline"
                        >
                          {row.element_name}
                        </Link>
                        <p className="font-mono text-[11px] text-[var(--psm-muted)]">{row.element_code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <ExecutivePsmElementCategoryBadge category={row.element_category} />
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
                    <ExecutivePsmElementStatusBadge status={row.element_status ?? 'Insufficient Data'} />
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        (row.critical_item_count ?? 0) > 0
                          ? 'bg-red-500/15 text-red-700 dark:text-red-400 font-bold'
                          : 'text-[var(--psm-muted)]'
                      }`}
                    >
                      {row.critical_item_count ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        (row.overdue_action_count ?? 0) > 0
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                          : 'text-[var(--psm-muted)]'
                      }`}
                    >
                      {row.overdue_action_count ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-[var(--psm-muted)]">
                    {row.missing_evidence_count ?? 0}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/executive/psm-elements/${row.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--psm-primary)] hover:underline"
                    >
                      Scorecard <ArrowRight className="h-3 w-3" />
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
          No PSM elements found matching current filters.
        </div>
      ) : null}
    </div>
  );
}
