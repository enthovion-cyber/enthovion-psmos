import type { ReactNode } from 'react';
import type { HazopReadinessCheck } from '../../types/hazop-review.types';

export function HazopReadinessChecklist({ checks }: { checks: HazopReadinessCheck[] }) {
  return <Panel title="Backend Readiness Checklist">{checks.map((check) => <div key={check.key} className="flex items-start justify-between gap-4 border-t border-[var(--psm-line)] py-3 first:border-t-0"><div><div className="font-semibold">{check.label}</div><p className="text-xs text-[var(--psm-muted)]">{check.message}</p></div><span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${check.status === 'Pass' ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200' : check.status === 'Warning' ? 'border-amber-400/30 bg-amber-500/15 text-amber-200' : 'border-red-400/30 bg-red-500/15 text-red-200'}`}>{check.status}</span></div>)}{!checks.length ? <p className="text-sm text-[var(--psm-muted)]">No readiness checks calculated yet.</p> : null}</Panel>;
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><h3 className="mb-3 font-semibold">{title}</h3>{children}</section>;
}
