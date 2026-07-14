import { cn } from '@/utils/cn';

export function HazopStatusBadge({ value }: { value?: string }) {
  const status = value ?? 'Draft';
  return <span className={cn('rounded-md border px-2 py-1 text-xs font-semibold uppercase', statusClass(status))}>{status}</span>;
}

export function RiskBadge({ value }: { value?: string }) {
  const risk = value ?? 'Low';
  return <span className={cn('rounded-md border px-2 py-1 text-xs font-semibold uppercase', riskClass(risk))}>{risk}</span>;
}

function statusClass(status: string) {
  if (['Closed', 'Approved'].includes(status)) return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  if (['In Progress', 'In Preparation', 'Review', 'Recommendations Open'].includes(status)) return 'border-blue-500/30 bg-blue-500/10 text-blue-300';
  if (['Pending Approval', 'Revalidation Due', 'Overdue'].includes(status)) return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
  if (['Cancelled'].includes(status)) return 'border-slate-500/30 bg-slate-500/10 text-slate-300';
  return 'border-slate-500/30 bg-slate-500/10 text-slate-300';
}

function riskClass(risk: string) {
  if (risk === 'Critical') return 'border-red-500/40 bg-red-500/10 text-red-300';
  if (risk === 'High') return 'border-orange-500/40 bg-orange-500/10 text-orange-300';
  if (risk === 'Medium') return 'border-amber-500/40 bg-amber-500/10 text-amber-300';
  return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
}
