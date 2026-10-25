'use client';

import React from 'react';
import type { ExecutiveScopePerformance } from '../types/executive-performance.types';

interface Props {
  kpiScorecards: ExecutiveScopePerformance['kpiScorecards'];
}

export function ExecutiveScopeKpiScorecardTable({ kpiScorecards }: Props) {
  if (!kpiScorecards || !kpiScorecards.length) {
    return (
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-8 text-center text-sm text-[var(--psm-muted)]">
        No KPI scorecards calculated for this scope.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-sm">
      <div className="border-b border-[var(--psm-line)] p-4 sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-[var(--psm-text)]">Calculated PSM KPIs</h2>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">
            Standard metrics aggregated from authorized module adapters.
          </p>
        </div>
        <span className="rounded-full bg-[var(--psm-surface-2)] px-2.5 py-1 text-xs font-semibold text-[var(--psm-muted)]">
          {kpiScorecards.length} Metrics
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
            <tr>
              <th className="px-4 py-3">Metric Code</th>
              <th className="px-4 py-3">Title & Category</th>
              <th className="px-4 py-3">Module</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Threshold</th>
              <th className="px-4 py-3">Records</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--psm-line)]">
            {kpiScorecards.map((row: any) => (
              <tr key={row.id ?? row.kpi_code} className="hover:bg-[var(--psm-surface-2)]">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-[var(--psm-primary)]">
                  {row.kpi_code}
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-[var(--psm-text)]">{row.kpi_title}</p>
                  <p className="text-xs text-[var(--psm-muted)]">{row.kpi_category}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-[var(--psm-surface-2)] px-2 py-0.5 text-xs font-medium text-[var(--psm-muted)]">
                    {row.source_module}
                  </span>
                </td>
                <td className="px-4 py-3 font-bold text-[var(--psm-text)]">
                  {row.kpi_value != null ? `${row.kpi_value}${row.unit ? ` ${row.unit}` : ''}` : row.kpi_text_value ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                    {row.kpi_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[var(--psm-muted)]">
                  {row.threshold_status ?? 'Standard'}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--psm-muted)]">
                  {row.source_count ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
