'use client';

import { HazopProgressBar } from './HazopProgressBar';

export function HazopStudyProgressCard({ progress, onNavigate }: { progress: any; onNavigate: (tab?: string) => void }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide">2. Study Progress / Readiness</h3>
        <span className="rounded-md border border-[var(--psm-line)] px-2 py-1 text-xs text-[var(--psm-muted)]">{progress.status}</span>
      </div>
      <div className="space-y-4">
        {(progress.metrics ?? []).map((metric: any) => (
          <button key={metric.key} onClick={() => onNavigate(metric.tab)} className="block w-full rounded-lg p-1 text-left hover:bg-[var(--psm-surface-2)]">
            <HazopProgressBar label={metric.label} percent={metric.percent} helper={metric.total !== undefined ? `${metric.done ?? 0} / ${metric.total ?? 0} - ${metric.percent}%` : `${metric.percent}%`} />
          </button>
        ))}
      </div>
    </section>
  );
}
