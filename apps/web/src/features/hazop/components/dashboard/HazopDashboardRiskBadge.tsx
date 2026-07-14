const riskTone: Record<string, string> = {
  Critical: 'border-red-400/40 bg-red-500/20 text-red-100',
  High: 'border-orange-400/40 bg-orange-500/20 text-orange-100',
  Medium: 'border-amber-400/40 bg-amber-500/20 text-amber-100',
  Low: 'border-emerald-400/40 bg-emerald-500/20 text-emerald-100'
};

export function HazopDashboardRiskBadge({ value }: { value?: string | null }) {
  const label = value || 'Low';
  return <span className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-semibold ${riskTone[label] ?? riskTone.Low}`}>{label}</span>;
}
