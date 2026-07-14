'use client';

import type { ReactNode } from 'react';

export function SilPanel({ title, subtitle, action, children, className = '' }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-cyan-300/10 dark:bg-[#071525] dark:shadow-none ${className}`}>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>{subtitle ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p> : null}</div>{action}</div>
    <div className="mt-4">{children}</div>
  </section>;
}

export function SilInfoGrid({ items }: { items: Array<[string, unknown]> }) {
  return <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">{items.map(([label, value]) => <div key={label} className="min-w-0 border-b border-slate-100 pb-2 dark:border-slate-800"><dt className="text-[10px] font-semibold uppercase text-slate-500">{label}</dt><dd className="mt-1 break-words text-xs font-semibold text-slate-800 dark:text-slate-200">{formatSilValue(value)}</dd></div>)}</dl>;
}

export function formatSilValue(value: unknown) {
  if (value == null || value === '') return 'Not set';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toExponential(3);
  return String(value);
}

export function SilStatus({ value }: { value: unknown }) {
  const text = formatSilValue(value); const key = text.toLowerCase();
  const tone = key.includes('complete') || key.includes('ready') || key.includes('adequate') || key === 'yes' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : key.includes('blocked') || key.includes('failed') || key.includes('open') || key.includes('required') ? 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300';
  return <span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-bold ${tone}`}>{text}</span>;
}
