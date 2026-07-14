'use client';

import { useState } from 'react';
import { useLopaDashboard } from '../../hooks/useLopa';
import { HazopRequiredScenariosPanel } from './HazopRequiredScenariosPanel';
import { LopaAttentionPanel } from './LopaAttentionPanel';
import { LopaDashboardFilters } from './LopaDashboardFilters';
import { LopaDashboardHeader } from './LopaDashboardHeader';
import { LopaQuickActions } from './LopaQuickActions';
import { LopaRegisterTable } from './LopaRegisterTable';
import { LopaSummaryCards } from './LopaSummaryCards';

export function LopaDashboardPage() {
  const [filters, setFilters] = useState<Record<string, any>>({ page: 1, limit: 20 });
  const queries = useLopaDashboard(filters);
  const search = filters.q ?? '';
  function patch(patchValues: Record<string, any>) {
    setFilters((current) => ({ ...current, ...patchValues, page: 1 }));
  }
  function refresh() {
    void queries.summary.refetch();
    void queries.register.refetch();
    void queries.attention.refetch();
    void queries.hazopScenarios.refetch();
  }
  function summaryFilter(key: string) {
    const map: Record<string, Record<string, any>> = {
      draft: { status: 'Draft' },
      pendingApproval: { status: 'Pending Approval' },
      overdue: { overdue: true },
      silRequired: { silRequired: true },
      calculationIncomplete: { calculationStatus: 'Incomplete' },
      iplValidationIncomplete: { iplValidationStatus: 'Incomplete' },
      createdFromHazop: { source: 'HAZOP/PHA' },
      manualStudies: { source: 'Manual' }
    };
    patch(map[key] ?? {});
  }
  return (
    <main className="space-y-4 pb-8 text-slate-100">
      <style jsx global>{`
        .lopa-button-primary { display:inline-flex; align-items:center; gap:.45rem; border-radius:.55rem; background:#2563eb; padding:.58rem .85rem; font-size:.82rem; font-weight:700; color:white; box-shadow:0 18px 40px rgba(37,99,235,.18); }
        .lopa-button-primary:hover { background:#3b82f6; }
        .lopa-button-secondary { display:inline-flex; align-items:center; gap:.45rem; border-radius:.55rem; border:1px solid rgba(103,232,249,.14); background:rgba(15,35,58,.9); padding:.55rem .8rem; font-size:.82rem; font-weight:700; color:#dbeafe; }
        .lopa-button-secondary:hover { border-color:rgba(96,165,250,.35); background:rgba(37,99,235,.12); }
      `}</style>
      <LopaDashboardHeader lastUpdated={queries.summary.data?.lastUpdated} search={search} onSearch={(q) => patch({ q })} onRefresh={refresh} />
      {queries.summary.isError ? <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">Permission denied or unable to load LOPA summary.</div> : null}
      <LopaSummaryCards summary={queries.summary.data} onFilter={summaryFilter} />
      <LopaQuickActions onFilter={patch} />
      <LopaDashboardFilters filters={filters} onChange={patch} onReset={() => setFilters({ page: 1, limit: 20 })} />
      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[1.2fr_.9fr_.9fr]">
        <HazopRequiredScenariosPanel scenarios={queries.hazopScenarios.data} isLoading={queries.hazopScenarios.isLoading} />
        <LopaAttentionPanel items={queries.attention.data} />
        <div className="rounded-xl border border-cyan-300/10 bg-[#071525] p-4">
          <h2 className="text-sm font-bold text-white">Risk / SIL Infographic</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              ['SIL Required', queries.summary.data?.silRequired ?? 0, 'text-violet-300'],
              ['SIL Gap Open', queries.summary.data?.silGapOpen ?? 0, 'text-red-300'],
              ['Critical Scenarios', queries.summary.data?.criticalScenarios ?? 0, 'text-orange-300'],
              ['IPL Incomplete', queries.summary.data?.iplValidationIncomplete ?? 0, 'text-amber-300']
            ].map(([label, count, color]) => (
              <div key={label as string} className="rounded-lg border border-cyan-300/10 bg-[#03101d] p-4">
                <div className={`text-2xl font-bold ${color}`}>{count}</div>
                <div className="text-xs text-slate-400">{label}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 h-24 rounded-lg border border-cyan-300/10 bg-[linear-gradient(90deg,rgba(16,185,129,.16),rgba(245,158,11,.16),rgba(239,68,68,.16))]" />
        </div>
      </div>
      <LopaRegisterTable data={queries.register.data} isLoading={queries.register.isLoading} isError={queries.register.isError} />
    </main>
  );
}
