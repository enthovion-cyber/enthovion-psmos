const statusStyles: Record<string, string> = {
  Draft: 'border-slate-400/30 bg-slate-500/15 text-slate-200',
  'In Preparation': 'border-cyan-400/30 bg-cyan-500/15 text-cyan-100',
  'In Progress': 'border-blue-400/30 bg-blue-500/15 text-blue-100',
  'Pending Review': 'border-amber-400/30 bg-amber-500/15 text-amber-100',
  'Pending Approval': 'border-orange-400/30 bg-orange-500/15 text-orange-100',
  Approved: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-100',
  Closed: 'border-zinc-400/30 bg-zinc-500/15 text-zinc-200',
  Cancelled: 'border-red-400/30 bg-red-500/15 text-red-100',
  Overdue: 'border-red-400/30 bg-red-500/15 text-red-100',
  'Revalidation Due': 'border-yellow-400/30 bg-yellow-500/15 text-yellow-100'
};

export function LopaStatusBadge({ value }: { value?: string | null | undefined }) {
  return <span className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${statusStyles[value ?? ''] ?? statusStyles.Draft}`}>{value ?? 'Draft'}</span>;
}

export function LopaSourceBadge({ value }: { value?: string | null | undefined }) {
  return <span className="rounded-md border border-cyan-300/20 bg-cyan-500/10 px-2 py-1 text-[11px] font-semibold text-cyan-100">{value ?? 'Manual'}</span>;
}

export function LopaSilBadge({ required, target, gap }: { required?: boolean | undefined; target?: string | null | undefined; gap?: string | null | undefined }) {
  const tone = gap === 'SIL Gap' ? 'border-red-400/30 bg-red-500/15 text-red-100' : required ? 'border-violet-400/30 bg-violet-500/15 text-violet-100' : 'border-slate-400/30 bg-slate-500/15 text-slate-200';
  return <span className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${tone}`}>{required ? target || 'SIL Required' : gap || 'Not Required'}</span>;
}

export function LopaRiskBadge({ value }: { value?: string | null | undefined }) {
  const tone = value === 'Critical' ? 'border-red-400/30 bg-red-500/15 text-red-100' : value === 'High' ? 'border-orange-400/30 bg-orange-500/15 text-orange-100' : value === 'Medium' ? 'border-amber-400/30 bg-amber-500/15 text-amber-100' : 'border-emerald-400/30 bg-emerald-500/15 text-emerald-100';
  return <span className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${tone}`}>{value ?? 'Low'}</span>;
}
