'use client';

import { AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { HazopReadinessRing } from './HazopReadinessRing';

export function HazopReviewReadinessCard({ readiness, onNavigate }: { readiness: any; onNavigate: (tab?: string) => void }) {
  const checks = readiness.checks ?? [];
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide">9. Review Readiness / Closure Blockers</h3>
        <button onClick={() => onNavigate('Review & Sign-Off')} className="text-xs font-semibold text-primary">Open review</button>
      </div>
      <div className="grid gap-4 lg:grid-cols-[160px_1fr]">
        <div className="grid place-items-center"><HazopReadinessRing percent={readiness.overallPercent ?? readiness.progress ?? 0} label={readiness.status ?? 'Ready'} /></div>
        <div className="space-y-2">
          {checks.slice(0, 6).map((check: any) => {
            const passed = check.status === 'Pass';
            const Icon = passed ? CheckCircle2 : check.status === 'Warning' ? AlertCircle : ShieldAlert;
            return (
              <div key={check.key ?? check.label} className="flex items-start justify-between gap-3 rounded-lg border border-[var(--psm-line)] p-2 text-sm">
                <span className="flex gap-2"><Icon size={15} className={passed ? 'text-emerald-300' : check.status === 'Warning' ? 'text-amber-300' : 'text-red-300'} />{check.label}</span>
                <span className="text-xs text-[var(--psm-muted)]">{check.status}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        <Mini label="Ready" value={readiness.counts?.ready ?? 0} tone="text-emerald-300" />
        <Mini label="At Risk" value={readiness.counts?.atRisk ?? 0} tone="text-amber-300" />
        <Mini label="Blocked" value={readiness.counts?.blocked ?? 0} tone="text-red-300" />
        <Mini label="Not Ready" value={readiness.counts?.notReady ?? 0} tone="text-slate-300" />
      </div>
      {(readiness.blockers ?? []).length ? (
        <div className="mt-4 space-y-2">
          {(readiness.blockers ?? []).slice(0, 4).map((blocker: any, index: number) => (
            <div key={`${blocker.blocker_key ?? index}`} className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm">
              <div className="font-semibold text-red-200">{blocker.blocker_title}</div>
              <div className="mt-1 text-[var(--psm-muted)]">{blocker.blocker_description}</div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Mini({ label, value, tone }: { label: string; value: any; tone: string }) {
  return <div className="rounded-lg border border-[var(--psm-line)] p-3"><div className={`text-xl font-semibold ${tone}`}>{value}</div><div className="text-xs text-[var(--psm-muted)]">{label}</div></div>;
}
