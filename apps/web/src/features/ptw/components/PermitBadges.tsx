const typeColors: Record<string, string> = {
  HOT_WORK: 'bg-red-500/15 text-red-400 border-red-500/30',
  COLD_WORK: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  CONFINED_SPACE: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  ELECTRICAL_ISOLATION: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  EXCAVATION: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  RADIOGRAPHY: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  WORKING_AT_HEIGHT: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  LINE_BREAKING: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  SIMOPS: 'bg-slate-500/15 text-slate-300 border-slate-500/30'
};

export function PermitTypeBadge({ type }: { type: string }) {
  return <span className={`rounded-md border px-2 py-1 text-[11px] font-bold ${typeColors[type] ?? typeColors.SIMOPS}`}>{type.replaceAll('_', ' ')}</span>;
}

export function PermitStatusBadge({ status }: { status: string }) {
  const cls = status === 'Active' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : status === 'Suspended' ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : status === 'Closed' ? 'bg-slate-500/15 text-slate-300 border-slate-500/30' : 'bg-blue-500/15 text-blue-300 border-blue-500/30';
  return <span className={`rounded-md border px-2 py-1 text-[11px] font-bold uppercase ${cls}`}>{status}</span>;
}

export function RiskBadge({ risk }: { risk: string }) {
  const cls = risk === 'Critical' || risk === 'High' ? 'border-red-500/40 bg-red-500/15 text-red-300' : risk === 'Medium' ? 'border-amber-500/40 bg-amber-500/15 text-amber-300' : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300';
  return <span className={`rounded-md border px-2 py-1 text-[11px] font-bold uppercase ${cls}`}>{risk}</span>;
}
