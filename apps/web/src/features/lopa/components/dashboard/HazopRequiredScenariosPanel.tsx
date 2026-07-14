import { Plus } from 'lucide-react';
import Link from 'next/link';
import type { LopaHazopScenario } from '../../types/lopa.types';
import { LopaRiskBadge } from '../shared/LopaBadges';

export function HazopRequiredScenariosPanel({ scenarios, isLoading }: { scenarios?: LopaHazopScenario[] | undefined; isLoading?: boolean | undefined }) {
  const rows = scenarios ?? [];
  return (
    <section className="rounded-xl border border-cyan-300/10 bg-[#071525] shadow-xl shadow-black/10">
      <div className="flex items-center justify-between border-b border-cyan-300/10 px-4 py-3">
        <h2 className="text-sm font-bold text-white">HAZOP Scenarios Requiring LOPA <span className="text-xs text-red-300">{rows.filter((s) => s.lopaStatus === 'Not Created').length}</span></h2>
        <Link href="/lopa/new?source=hazop" className="text-xs font-semibold text-blue-300">Create from HAZOP</Link>
      </div>
      {isLoading ? <div className="p-5 text-sm text-slate-400">Loading HAZOP required scenarios...</div> : null}
      {!isLoading && !rows.length ? <div className="p-5 text-sm text-slate-400">No HAZOP LOPA-required scenarios are waiting for LOPA.</div> : null}
      <div className="max-h-[360px] divide-y divide-cyan-300/10 overflow-auto">
        {rows.slice(0, 10).map((row) => (
          <div key={row.id} className="grid grid-cols-[1fr_auto] gap-3 px-4 py-3 text-sm">
            <div>
              <div className="font-semibold text-blue-300">{row.hazopNumber} <span className="text-slate-500">/ {row.nodeTitle ?? row.nodeNumber ?? 'Node'}</span></div>
              <div className="mt-1 text-slate-200">{row.deviation || row.consequence}</div>
              <div className="mt-1 text-xs text-slate-500">{row.consequence}</div>
              <div className="mt-2 flex flex-wrap gap-2"><LopaRiskBadge value={row.riskLevel} /><span className="rounded-md border border-cyan-300/10 px-2 py-1 text-[11px] text-slate-300">{row.lopaStatus}</span></div>
            </div>
            <Link href={row.existingLopaId ? `/lopa/${row.existingLopaId}` : `/lopa/new?hazopScenarioId=${row.id}`} className="self-center rounded-lg border border-blue-400/30 bg-blue-500/10 p-2 text-blue-200 hover:bg-blue-500/20"><Plus size={16} /></Link>
          </div>
        ))}
      </div>
    </section>
  );
}
