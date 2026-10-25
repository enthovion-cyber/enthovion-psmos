const typeColors: Record<string, string> = {
  HOT_WORK: 'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30',
  COLD_WORK: 'bg-sky-50 dark:bg-cyan-500/15 text-sky-700 dark:text-cyan-300 border-sky-200 dark:border-cyan-500/30',
  CONFINED_SPACE: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
  ELECTRICAL_ISOLATION: 'bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
  EXCAVATION: 'bg-orange-50 dark:bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-500/30',
  RADIOGRAPHY: 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30',
  WORKING_AT_HEIGHT: 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30',
  LINE_BREAKING: 'bg-yellow-50 dark:bg-yellow-500/15 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-500/30',
  SIMOPS: 'bg-slate-100 dark:bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-500/30'
};

export function PermitTypeBadge({ type }: { type: string }) {
  return <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide ${typeColors[type] ?? typeColors.SIMOPS}`}>{type.replaceAll('_', ' ')}</span>;
}

export function PermitStatusBadge({ status }: { status: string }) {
  const cls = status === 'Active'
    ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
    : status === 'Suspended'
    ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30'
    : status === 'Closed'
    ? 'bg-slate-100 dark:bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-500/30'
    : 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30';
  return <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cls}`}>{status}</span>;
}

export function RiskBadge({ risk }: { risk: string }) {
  const cls = risk === 'Critical' || risk === 'High'
    ? 'border-red-200 dark:border-red-500/40 bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300'
    : risk === 'Medium'
    ? 'border-amber-200 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300'
    : 'border-emerald-200 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
  return <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cls}`}>{risk}</span>;
}
