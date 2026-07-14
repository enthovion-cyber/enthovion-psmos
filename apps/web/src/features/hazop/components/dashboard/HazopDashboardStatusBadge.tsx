const statusTone: Record<string, string> = {
  Draft: 'border-slate-400/30 bg-slate-500/15 text-slate-200',
  Planned: 'border-cyan-400/30 bg-cyan-500/15 text-cyan-200',
  'In Preparation': 'border-blue-400/30 bg-blue-500/15 text-blue-200',
  'In Progress': 'border-blue-400/30 bg-blue-500/15 text-blue-200',
  'In Review': 'border-amber-400/30 bg-amber-500/15 text-amber-200',
  'Pending Approval': 'border-violet-400/30 bg-violet-500/15 text-violet-200',
  Approved: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200',
  Closed: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200',
  Reopened: 'border-orange-400/30 bg-orange-500/15 text-orange-200',
  Cancelled: 'border-red-400/30 bg-red-500/15 text-red-200',
  Overdue: 'border-red-400/30 bg-red-500/15 text-red-200'
};

export function HazopDashboardStatusBadge({ value }: { value?: string | null }) {
  const label = value || 'Unknown';
  return <span className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-semibold ${statusTone[label] ?? statusTone.Draft}`}>{label}</span>;
}
