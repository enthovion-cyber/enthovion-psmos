'use client';

import React, { useState } from 'react';
import { Sliders } from 'lucide-react';
import { useExecutivePsmElementMappings, useExecutivePsmElementKpiMappings } from '../hooks/useExecutivePsmElementMappings';
import { ExecutiveOverviewNavigation } from '../components/ExecutiveOverview';
import { ExecutiveThemeToggle } from '../components/shared/ExecutiveThemeToggle';
import { EditPsmElementMappingDialog } from './dialogs/EditPsmElementMappingDialog';
import { useMyPermissions } from '@/features/iam/hooks/useIam';

export function ExecutivePsmElementMappingPage() {
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);
  const canEdit = granted.has('executive.psm_element.mapping.edit');
  const [selectedMapping, setSelectedMapping] = useState<any>(null);

  const moduleMappingsQuery = useExecutivePsmElementMappings();
  const kpiMappingsQuery = useExecutivePsmElementKpiMappings();

  const moduleMappings = moduleMappingsQuery.data ?? [];
  const kpiMappings = kpiMappingsQuery.data ?? [];

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-primary)]">
            Executive KPI · Governance Configuration
          </p>
          <h1 className="text-2xl font-bold text-[var(--psm-text)]">Element-to-Module Mapping</h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">
            Configure how PSM modules, inspection workflows, and KPIs contribute weight to each element.
          </p>
        </div>
        <ExecutiveThemeToggle />
      </header>

      {/* Module Mappings Table */}
      <div className="overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-sm">
        <div className="border-b border-[var(--psm-line)] p-4">
          <h2 className="font-bold text-base text-[var(--psm-text)]">Module Mappings</h2>
          <p className="text-xs text-[var(--psm-muted)]">Source modules bound to process safety management elements.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]">
              <tr>
                <th className="px-4 py-3">Source Module</th>
                <th className="px-4 py-3">Element ID</th>
                <th className="px-4 py-3">Mapping Type</th>
                <th className="px-4 py-3">Weight</th>
                <th className="px-4 py-3">Mandatory</th>
                {canEdit ? <th className="px-4 py-3 text-right">Actions</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--psm-line)]">
              {moduleMappings.map((m: any) => (
                <tr key={m.id} className="hover:bg-[var(--psm-surface-2)]">
                  <td className="px-4 py-3.5 font-bold text-[var(--psm-text)]">
                    {m.source_module_label ?? m.source_module}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-[var(--psm-muted)]">{m.element_id}</td>
                  <td className="px-4 py-3.5 text-xs text-[var(--psm-text)]">{m.mapping_type ?? 'Health Score'}</td>
                  <td className="px-4 py-3.5 font-semibold text-[var(--psm-text)]">{m.weight != null ? `${m.weight}%` : 'Standard'}</td>
                  <td className="px-4 py-3.5 text-xs">
                    {m.required_for_score ? (
                      <span className="rounded bg-rose-500/15 px-2 py-0.5 font-bold text-rose-700 dark:text-rose-400">
                        Required
                      </span>
                    ) : (
                      <span className="text-[var(--psm-muted)]">Optional</span>
                    )}
                  </td>
                  {canEdit ? (
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedMapping(m)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--psm-primary)] hover:underline"
                      >
                        <Sliders className="h-3 w-3" /> Configure
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <EditPsmElementMappingDialog
        open={Boolean(selectedMapping)}
        onOpenChange={(open) => !open && setSelectedMapping(null)}
        mapping={selectedMapping}
      />
    </main>
  );
}
