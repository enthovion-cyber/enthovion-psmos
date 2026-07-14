'use client';

import type { ReactNode } from 'react';

export function PSSRCard({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return <section className="rounded-xl border border-cyan-300/10 bg-[#07182a]/95 p-4 shadow-xl shadow-black/10"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-sm font-black uppercase tracking-wide text-white">{title}</h2>{action}</div>{children}</section>;
}

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: 'green' | 'amber' | 'red' | 'blue' | 'slate' | 'purple' }) {
  const tones = { green: 'border-emerald-300/25 bg-emerald-500/15 text-emerald-200', amber: 'border-amber-300/25 bg-amber-500/15 text-amber-200', red: 'border-red-300/25 bg-red-500/15 text-red-200', blue: 'border-blue-300/25 bg-blue-500/15 text-blue-200', purple: 'border-violet-300/25 bg-violet-500/15 text-violet-200', slate: 'border-white/10 bg-white/[0.04] text-slate-200' };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>;
}

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return <div className="rounded-lg border border-dashed border-cyan-300/20 p-6 text-center"><p className="font-bold text-slate-200">{title}</p>{detail ? <p className="mt-1 text-sm text-slate-500">{detail}</p> : null}</div>;
}

export function LoadingState() {
  return <div className="space-y-3">{[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-lg bg-white/[0.05]" />)}</div>;
}

export function ErrorState({ message = 'Unable to load PSSR data.' }: { message?: string }) {
  return <div className="rounded-lg border border-red-300/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">{message}</div>;
}

export function Field({ label, children, error, required }: { label: string; children: ReactNode; error?: string | undefined; required?: boolean | undefined }) {
  return <label className="block"><span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">{label}{required ? <span className="text-red-300"> *</span> : null}</span>{children}{error ? <span className="mt-1 block text-xs font-bold text-red-300">{error}</span> : null}</label>;
}

export const inputClass = 'h-11 w-full rounded-md border border-cyan-300/15 bg-slate-950/45 px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-300';
export const textareaClass = 'min-h-24 w-full rounded-md border border-cyan-300/15 bg-slate-950/45 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-300';

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
  const tones = { blue: 'bg-blue-400', green: 'bg-emerald-400', amber: 'bg-amber-400', red: 'bg-red-400' };
  return <div className="h-2 overflow-hidden rounded-full bg-slate-900"><div className={`h-full ${tones[tone]}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}
