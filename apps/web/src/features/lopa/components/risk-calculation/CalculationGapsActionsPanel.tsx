import { Plus } from 'lucide-react';
import { LopaPanel, TonePill } from '../overview/LopaOverviewShared';

export function CalculationGapsActionsPanel({ rows = [], readOnly, onCreateMissing, onCreateRiskGapAction, onCreateAction }: { rows?: any[]; readOnly?: boolean; onCreateMissing: () => void; onCreateRiskGapAction: () => void; onCreateAction: (gapId: string) => void }) {
  return (
    <LopaPanel title="Calculation Gaps & Actions" action={<div className="flex gap-2"><button className="lopa-button-secondary disabled:opacity-50" disabled={readOnly} onClick={onCreateMissing}><Plus size={14} />Missing Input Actions</button><button className="lopa-button-secondary disabled:opacity-50" disabled={readOnly} onClick={onCreateRiskGapAction}>Risk Gap Action</button></div>}>
      <div className="grid gap-2">
        {rows.length ? rows.map((row) => <div key={row.id} className="rounded-lg border border-cyan-300/10 bg-[#03101d] p-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="font-semibold text-white">{row.gap_title}</div><div className="text-xs text-slate-500">{row.gap_type} · {row.gap_description ?? 'No description'}</div></div><div className="flex items-center gap-2"><TonePill tone={row.closure_blocker ? 'danger' : 'warning'}>{row.severity ?? 'Medium'}</TonePill><button className="rounded border border-blue-400/20 px-2 py-1 text-xs font-bold text-blue-100 disabled:opacity-50" disabled={readOnly || !!row.action_id} onClick={() => onCreateAction(row.id)}>{row.action_id ? 'Action linked' : 'Create action'}</button></div></div></div>) : <div className="text-sm text-slate-400">No calculation gaps recorded.</div>}
      </div>
    </LopaPanel>
  );
}
