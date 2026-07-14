import type { ReactNode } from 'react';

export function LopaPanel({ title, action, children, className = '' }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-cyan-300/10 bg-[#071525] shadow-xl shadow-black/10 ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-cyan-300/10 px-4 py-3">
        <h2 className="text-sm font-bold text-white">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function FieldGrid({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-cyan-300/10 bg-[#03101d] p-3">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
          <div className="mt-1 text-sm font-semibold text-slate-100">{value ?? '-'}</div>
        </div>
      ))}
    </div>
  );
}

export function TonePill({ children, tone = 'neutral' }: { children: ReactNode; tone?: string }) {
  const styles: Record<string, string> = {
    success: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-100',
    warning: 'border-amber-400/30 bg-amber-500/15 text-amber-100',
    danger: 'border-red-400/30 bg-red-500/15 text-red-100',
    info: 'border-blue-400/30 bg-blue-500/15 text-blue-100',
    neutral: 'border-slate-400/30 bg-slate-500/15 text-slate-200'
  };
  return <span className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-bold ${styles[tone] ?? styles.neutral}`}>{children}</span>;
}

export function ProgressBar({ value, tone = 'info' }: { value: number; tone?: string }) {
  const colors: Record<string, string> = { success: 'bg-emerald-400', warning: 'bg-amber-400', danger: 'bg-red-400', info: 'bg-blue-400' };
  return (
    <div className="h-2 rounded-full bg-slate-800">
      <div className={`h-2 rounded-full ${colors[tone] ?? colors.info}`} style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} />
    </div>
  );
}
