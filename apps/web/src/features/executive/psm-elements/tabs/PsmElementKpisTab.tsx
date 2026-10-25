'use client';

import React from 'react';
import type { PsmElementDetail } from '../../types/executive-psm-element.types';

interface Props {
  detail: PsmElementDetail;
}

export function PsmElementKpisTab({ detail }: Props) {
  const kpis = detail.kpis ?? [];

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-sm">
      <div className="border-b border-[var(--psm-line)] p-4">
        <h3 className="font-bold text-base text-[var(--psm-text)]">Contributing KPIs</h3>
        <p className="mt-1 text-xs text-[var(--psm-muted)]">
          Specific metric definitions evaluated in this element&apos;s mathematical score calculation.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]">
            <tr>
              <th className="px-4 py-3">KPI Code</th>
              <th className="px-4 py-3">Source Module</th>
              <th className="px-4 py-3">Contribution Type</th>
              <th className="px-4 py-3">Weight</th>
              <th className="px-4 py-3">Required</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--psm-line)]">
            {kpis.map((kpi: any) => (
              <tr key={kpi.id ?? kpi.kpi_code} className="hover:bg-[var(--psm-surface-2)]">
                <td className="px-4 py-3.5 font-mono font-bold text-[var(--psm-primary)]">
                  {kpi.kpi_code}
                </td>
                <td className="px-4 py-3.5 text-xs text-[var(--psm-muted)]">
                  {kpi.source_module ?? 'Universal'}
                </td>
                <td className="px-4 py-3.5 text-xs text-[var(--psm-text)]">
                  {kpi.contribution_type ?? 'Direct Weight'}
                </td>
                <td className="px-4 py-3.5 font-semibold text-[var(--psm-text)]">
                  {kpi.weight != null ? `${kpi.weight}%` : 'Standard'}
                </td>
                <td className="px-4 py-3.5 text-xs">
                  {kpi.required_for_score ? (
                    <span className="rounded bg-rose-500/15 px-2 py-0.5 font-bold text-rose-700 dark:text-rose-400">
                      Mandatory
                    </span>
                  ) : (
                    <span className="text-[var(--psm-muted)]">Flexible</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!kpis.length ? (
        <div className="py-12 text-center text-sm text-[var(--psm-muted)]">
          No specific KPIs mapped directly to this element.
        </div>
      ) : null}
    </div>
  );
}
