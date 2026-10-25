'use client';

import type { ReactNode } from 'react';

export function PSSRCard({ title, action, children }: { title: ReactNode; action?: ReactNode | undefined; children: ReactNode }) {
  return <section className="rounded-xl border border-[var(--psm-line,rgba(103,232,249,0.1))] bg-[var(--psm-surface,#07182a)] p-4 shadow-xl shadow-black/10 transition-colors duration-200"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-sm font-black uppercase tracking-wide text-[var(--psm-fg,#ffffff)]">{title}</h2>{action}</div>{children}</section>;
}

export function Badge({ children, tone = 'slate', className = '' }: { children: ReactNode; tone?: 'green' | 'amber' | 'red' | 'blue' | 'slate' | 'purple' | 'cyan' | undefined; className?: string | undefined }) {
  const tones = {
    green: 'border-emerald-500/25 bg-emerald-500/15 text-emerald-400 dark:text-emerald-200',
    amber: 'border-amber-500/25 bg-amber-500/15 text-amber-500 dark:text-amber-200',
    red: 'border-red-500/25 bg-red-500/15 text-red-500 dark:text-red-200',
    blue: 'border-blue-500/25 bg-blue-500/15 text-blue-500 dark:text-blue-200',
    purple: 'border-violet-500/25 bg-violet-500/15 text-violet-500 dark:text-violet-200',
    slate: 'border-[var(--psm-line,rgba(255,255,255,0.1))] bg-[var(--psm-surface-2,rgba(255,255,255,0.04))] text-[var(--psm-fg,#e2e8f0)]',
    cyan: 'border-cyan-500/25 bg-cyan-500/15 text-cyan-500 dark:text-cyan-200'
  };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${tones[tone ?? 'slate'] ?? tones.slate} ${className}`}>{children}</span>;
}

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return <div className="rounded-lg border border-dashed border-[var(--psm-line,rgba(103,232,249,0.2))] p-6 text-center"><p className="font-bold text-[var(--psm-fg,#e2e8f0)]">{title}</p>{detail ? <p className="mt-1 text-sm text-[var(--psm-muted,#64748b)]">{detail}</p> : null}</div>;
}

export function LoadingState() {
  return <div className="space-y-3">{[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-lg bg-[var(--psm-surface-2,rgba(255,255,255,0.05))]" />)}</div>;
}

export function ErrorState({ message = 'Unable to load PSSR data.' }: { message?: string }) {
  return <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold text-red-400 dark:text-red-200">{message}</div>;
}

export function Field({ label, children, error, required }: { label: string; children: ReactNode; error?: string | undefined; required?: boolean | undefined }) {
  return <label className="block"><span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--psm-muted,#94a3b8)]">{label}{required ? <span className="text-red-400"> *</span> : null}</span>{children}{error ? <span className="mt-1 block text-xs font-bold text-red-400">{error}</span> : null}</label>;
}

export const inputClass = 'h-11 w-full rounded-md border border-[var(--psm-line,rgba(103,232,249,0.15))] bg-[var(--psm-surface-2,rgba(2,6,23,0.45))] px-3 text-sm text-[var(--psm-fg,#ffffff)] outline-none placeholder:text-[var(--psm-muted,#64748b)] focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-colors';
export const textareaClass = 'min-h-24 w-full rounded-md border border-[var(--psm-line,rgba(103,232,249,0.15))] bg-[var(--psm-surface-2,rgba(2,6,23,0.45))] px-3 py-2 text-sm text-[var(--psm-fg,#ffffff)] outline-none placeholder:text-[var(--psm-muted,#64748b)] focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-colors';

export function statusTone(status?: string): 'green' | 'amber' | 'red' | 'blue' | 'slate' {
  if (['Authorized For Startup', 'Startup Released', 'Closed'].includes(status ?? '')) return 'green';
  if (['Rejected', 'Cancelled'].includes(status ?? '')) return 'red';
  if (['Punch List Open', 'Field Verification', 'Ready For Authorization'].includes(status ?? '')) return 'amber';
  if (['Created', 'In Preparation', 'In Review'].includes(status ?? '')) return 'blue';
  return 'slate';
}

export function riskTone(risk?: string): 'green' | 'amber' | 'red' | 'purple' {
  if (risk === 'Critical') return 'purple';
  if (risk === 'High') return 'red';
  if (risk === 'Medium') return 'amber';
  return 'green';
}

export function ProgressBar({ value, tone = 'blue' }: { value: number; tone?: 'blue' | 'green' | 'amber' | 'red' }) {
  const tones = { blue: 'bg-blue-500', green: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-red-500' };
  return <div className="h-2 overflow-hidden rounded-full bg-[var(--psm-surface-2,#0f172a)]"><div className={`h-full transition-all duration-300 ${tones[tone]}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}
