export function HazopHistorySeverityBadge({ value }: { value?: string }) {
  const severity = value ?? 'Info';
  const color = severity === 'Critical' || severity === 'High' ? 'border-red-400/30 bg-red-500/15 text-red-200' : severity === 'Medium' ? 'border-amber-400/30 bg-amber-500/15 text-amber-200' : 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200';
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${color}`}>{severity}</span>;
}
