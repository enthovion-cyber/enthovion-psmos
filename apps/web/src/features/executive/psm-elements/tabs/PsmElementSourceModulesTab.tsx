'use client';

import React from 'react';
import type { PsmElementDetail } from '../../types/executive-psm-element.types';

interface Props {
  detail: PsmElementDetail;
}

export function PsmElementSourceModulesTab({ detail }: Props) {
  const modules = detail.modules ?? [];

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-sm">
      <div className="border-b border-[var(--psm-line)] p-4">
        <h3 className="font-bold text-base text-[var(--psm-text)]">Mapped Source Modules</h3>
        <p className="mt-1 text-xs text-[var(--psm-muted)]">
          PSM modules that feed operational metrics, inspections, and compliance checks into this element.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]">
            <tr>
              <th className="px-4 py-3">Source Module</th>
              <th className="px-4 py-3">Key</th>
              <th className="px-4 py-3">Mapping Type</th>
              <th className="px-4 py-3">Weight</th>
              <th className="px-4 py-3">Mandatory</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--psm-line)]">
            {modules.map((mod: any) => (
              <tr key={mod.id ?? mod.source_module} className="hover:bg-[var(--psm-surface-2)]">
                <td className="px-4 py-3.5 font-bold text-[var(--psm-text)]">
                  {mod.source_module_label ?? mod.source_module}
                </td>
                <td className="px-4 py-3.5 font-mono text-xs text-[var(--psm-muted)]">
                  {mod.source_module}
                </td>
                <td className="px-4 py-3.5 text-xs text-[var(--psm-text)]">
                  {mod.mapping_type ?? 'Health Score'}
                </td>
                <td className="px-4 py-3.5 font-semibold text-[var(--psm-text)]">
                  {mod.weight != null ? `${mod.weight}%` : 'Standard'}
                </td>
                <td className="px-4 py-3.5 text-xs">
                  {mod.required_for_score ? (
                    <span className="rounded bg-rose-500/15 px-2 py-0.5 font-bold text-rose-700 dark:text-rose-400">
                      Required
                    </span>
                  ) : (
                    <span className="text-[var(--psm-muted)]">Optional</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-xs">
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-700 dark:text-emerald-400">
                    Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!modules.length ? (
        <div className="py-12 text-center text-sm text-[var(--psm-muted)]">
          No source modules mapped to this element.
        </div>
      ) : null}
    </div>
  );
}
