'use client';

import { cn } from '@/utils/cn';

export function HazopRecommendationStatusBadge({ value }: { value?: string }) {
  const status = value ?? 'Draft';
  const tone = ['Verified Closed'].includes(status)
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
    : ['Overdue', 'Rejected', 'Cancelled'].includes(status)
      ? 'border-red-500/30 bg-red-500/10 text-red-300'
      : ['Pending Evidence', 'Pending Verification', 'Deferred'].includes(status)
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
        : ['In Progress', 'Assigned', 'Open'].includes(status)
          ? 'border-blue-500/30 bg-blue-500/10 text-blue-300'
          : 'border-slate-500/30 bg-slate-500/10 text-slate-300';
  return <span className={cn('rounded-md border px-2 py-1 text-xs font-semibold uppercase', tone)}>{status}</span>;
}

export function RecommendationPanel({ title, children, action }: { title: string; children: any; action?: any }) {
  return <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-semibold">{title}</h3>{action}</div>{children}</section>;
}

export function RecommendationPill({ children, tone = 'slate' }: { children: any; tone?: 'green' | 'amber' | 'red' | 'blue' | 'slate' }) {
  const styles = {
    green: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    red: 'border-red-500/30 bg-red-500/10 text-red-300',
    blue: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    slate: 'border-slate-500/30 bg-slate-500/10 text-slate-300'
  };
  return <span className={cn('rounded-md border px-2 py-1 text-xs font-semibold uppercase', styles[tone])}>{children}</span>;
}
