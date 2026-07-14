'use client';

const statusTone: Record<string, string> = {
  Approved: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
  Draft: 'border-slate-400/25 bg-slate-500/10 text-slate-200',
  'Pending Review': 'border-amber-400/30 bg-amber-500/10 text-amber-200',
  Rejected: 'border-red-400/30 bg-red-500/10 text-red-200',
  Superseded: 'border-violet-400/30 bg-violet-500/10 text-violet-200',
  Archived: 'border-zinc-400/30 bg-zinc-500/10 text-zinc-200',
  Passed: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
  Failed: 'border-red-400/30 bg-red-500/10 text-red-200',
  'In Progress': 'border-blue-400/30 bg-blue-500/10 text-blue-200',
  'Not Started': 'border-slate-400/25 bg-slate-500/10 text-slate-200',
  'Needs Evidence': 'border-amber-400/30 bg-amber-500/10 text-amber-200'
};

export function IplRegistryStatusBadge({ value }: { value?: string | null }) {
  const label = value || 'Draft';
  return <span className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-black uppercase ${statusTone[label] ?? statusTone.Draft}`}>{label}</span>;
}

export function IplRegistryRiskBadge({ value }: { value?: string | number | null }) {
  const bad = value == null || value === '';
  return <span className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-bold ${bad ? 'border-red-400/25 bg-red-500/10 text-red-200' : 'border-cyan-400/25 bg-cyan-500/10 text-cyan-200'}`}>{bad ? 'Missing' : value}</span>;
}
