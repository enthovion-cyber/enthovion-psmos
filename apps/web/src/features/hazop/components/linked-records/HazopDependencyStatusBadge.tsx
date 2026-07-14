export function HazopDependencyStatusBadge({ value }: { value?: string }) {
  const status = value ?? 'Not Blocking';
  const color = status === 'Blocking' ? 'border-red-400/40 bg-red-500/15 text-red-200' : status === 'Needs Review' ? 'border-amber-400/40 bg-amber-500/15 text-amber-200' : 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200';
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${color}`}>{status}</span>;
}
