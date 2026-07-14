import { LopaPanel, TonePill } from '../overview/LopaOverviewShared';

export function CalculationVersionSnapshotPanel({ rows = [] }: { rows?: any[] }) {
  return (
    <LopaPanel title="Calculation Versions / Snapshots">
      <div className="grid gap-2">
        {rows.length ? rows.map((row) => <div key={row.id} className="flex items-center justify-between gap-3 rounded-lg border border-cyan-300/10 bg-[#03101d] p-3 text-sm"><div><div className="font-bold text-white">Version {row.version_number}</div><div className="text-xs text-slate-500">{row.calculated_at ? new Date(row.calculated_at).toLocaleString() : 'Not calculated'} · Hash {row.input_hash ?? '-'}</div></div><TonePill tone={row.status === 'Pass' ? 'success' : row.status === 'Fail' ? 'danger' : 'neutral'}>{row.status ?? 'Snapshot'}</TonePill></div>) : <div className="text-sm text-slate-400">No calculation snapshots yet.</div>}
      </div>
    </LopaPanel>
  );
}
