'use client';

import type { LucideIcon } from 'lucide-react';

const tones: Record<string, string> = {
  blue: 'from-blue-500/20 text-blue-200',
  teal: 'from-teal-500/20 text-teal-200',
  red: 'from-red-500/20 text-red-200',
  amber: 'from-amber-500/20 text-amber-200',
  purple: 'from-purple-500/20 text-purple-200',
  green: 'from-emerald-500/20 text-emerald-200',
  cyan: 'from-cyan-500/20 text-cyan-200',
  orange: 'from-orange-500/20 text-orange-200',
  slate: 'from-slate-500/20 text-slate-200'
};

export function HazopMetricCard({ icon: Icon, label, value, helper, tone = 'blue', onClick }: { icon: LucideIcon; label: string; value: string | number; helper?: string; tone?: string; onClick?: () => void }) {
  const className = tones[tone] ?? tones.blue;
  return (
    <button onClick={onClick} className="group rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-[var(--psm-surface-2)]">
      <div className="flex items-start justify-between gap-3">
        <div className={`rounded-lg bg-gradient-to-br to-transparent p-2 ${className}`}><Icon size={20} /></div>
        <span className="text-xs text-primary opacity-0 transition group-hover:opacity-100">Open</span>
      </div>
      <div className="mt-3 text-2xl font-semibold text-[var(--psm-text)]">{value}</div>
      <div className="text-sm font-medium text-[var(--psm-text)]">{label}</div>
      <div className="mt-1 text-xs text-[var(--psm-muted)]">{helper ?? 'Live from API'}</div>
    </button>
  );
}
