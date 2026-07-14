export function ReportStatusBadge({ status }: { status?: string }) {
  const s = status ?? 'Unknown';
  const tone = /failed|blocked|deleted/i.test(s) ? 'border-red-400/30 bg-red-500/10 text-red-700 dark:text-red-200' : /official|published|generated|complete/i.test(s) ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200' : /draft|warning|not ready/i.test(s) ? 'border-amber-400/30 bg-amber-500/10 text-amber-700 dark:text-amber-200' : 'border-slate-300 bg-slate-100 text-slate-700 dark:border-cyan-300/10 dark:bg-slate-800 dark:text-slate-200';
  return <span className={`rounded px-2 py-0.5 text-[11px] font-bold ${tone}`}>{s}</span>;
}
