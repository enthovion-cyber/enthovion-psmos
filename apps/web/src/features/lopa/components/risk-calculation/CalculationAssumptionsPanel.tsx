import { Plus } from 'lucide-react';
import { LopaPanel, TonePill } from '../overview/LopaOverviewShared';

export function CalculationAssumptionsPanel({ rows = [], readOnly, onAdd }: { rows?: any[]; readOnly?: boolean; onAdd: () => void }) {
  return (
    <LopaPanel title="Assumptions & Basis" action={<button className="lopa-button-secondary disabled:opacity-50" disabled={readOnly} onClick={onAdd}><Plus size={14} />Add</button>}>
      <div className="grid gap-2">
        {rows.length ? rows.map((row) => <div key={row.id} className="rounded-lg border border-cyan-300/10 bg-[#03101d] p-3"><div className="flex items-center justify-between gap-2"><div className="font-semibold text-white">{row.assumption_title}</div><TonePill>{row.assumption_type ?? 'Assumption'}</TonePill></div><p className="mt-2 text-sm text-slate-400">{row.description ?? 'No description'}</p><div className="mt-2 text-xs text-slate-500">{row.source_reference ?? 'No source reference'}</div></div>) : <div className="text-sm text-slate-400">No assumptions recorded.</div>}
      </div>
    </LopaPanel>
  );
}
