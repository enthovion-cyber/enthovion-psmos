'use client';

import type { LucideIcon } from 'lucide-react';

const tones: Record<string, string> = {
  blue: 'from-blue-500/20 text-blue-600 dark:text-blue-300',
  teal: 'from-teal-500/20 text-teal-600 dark:text-teal-300',
  red: 'from-rose-500/20 text-rose-600 dark:text-rose-400',
  amber: 'from-amber-600/20 text-amber-600 dark:text-amber-400',
  purple: 'from-purple-500/20 text-purple-600 dark:text-purple-300',
  green: 'from-emerald-500/20 text-emerald-600 dark:text-emerald-300',
  cyan: 'from-cyan-500/20 text-cyan-600 dark:text-cyan-300',
  orange: 'from-orange-500/20 text-orange-600 dark:text-orange-400',
  slate: 'from-slate-500/20 text-slate-700 dark:text-slate-300'
};

export function HazopMetricCard({
  icon: Icon,
  label,
  value,
  helper,
  tone = 'blue',
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  helper?: string | null | undefined;
  tone?: string | undefined;
  onClick?: (() => void) | undefined;
}) {
  const className = tones[tone ?? 'blue'] ?? tones.blue;
  return (
    <button onClick={onClick} className="group rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 sm:p-3.5 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-[var(--psm-surface-2)]">
      <div className="flex items-start justify-between gap-2">
        <div className={`rounded-lg bg-gradient-to-br to-transparent p-1.5 sm:p-2 ${className}`}><Icon size={18} /></div>
        <span className="text-[11px] font-medium text-primary opacity-0 transition group-hover:opacity-100">Open &rarr;</span>
      </div>
      <div className="mt-2.5 text-xl sm:text-2xl font-bold tracking-tight text-[var(--psm-text)]">{value}</div>
      <div className="text-xs sm:text-sm font-medium text-[var(--psm-text)] truncate">{label}</div>
      <div className="mt-0.5 text-[11px] text-[var(--psm-muted)] truncate">{helper ?? 'Live from API'}</div>
    </button>
  );
}
