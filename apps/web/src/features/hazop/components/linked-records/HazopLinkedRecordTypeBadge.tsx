export function HazopLinkedRecordTypeBadge({ type }: { type?: string }) {
  const value = type ?? 'Record';
  const color = value === 'MOC' ? 'bg-purple-500/15 text-purple-200 border-purple-400/30' : value === 'PSSR' ? 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30' : value === 'PTW' ? 'bg-amber-500/15 text-amber-200 border-amber-400/30' : value === 'Equipment' ? 'bg-cyan-500/15 text-cyan-200 border-cyan-400/30' : 'bg-slate-500/15 text-slate-200 border-slate-400/30';
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${color}`}>{value}</span>;
}
