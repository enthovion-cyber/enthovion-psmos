import { TrainingCard, TrainingEmptyState, TrainingProgress } from '../shared/TrainingUi';

export function TrainingReadinessByUnit({ rows = [] }: { rows?: Array<Record<string, any>> }) {
  return (
    <TrainingCard title="Training Readiness by Unit" subtitle="Unit readiness appears after site/unit assignments are created.">
      {!rows.length ? <TrainingEmptyState title="No unit readiness yet" message="Assign workers to units to generate unit-level readiness." /> : <div className="space-y-3">{rows.map((row) => <div key={row.unitId ?? 'missing'} className="rounded-lg border border-[var(--psm-line)] p-3"><div className="flex justify-between gap-3 text-sm"><span className="font-semibold">{row.unitName}</span><span>{row.readinessPercent}%</span></div><div className="mt-2"><TrainingProgress value={row.readinessPercent} /></div><p className="mt-2 text-xs text-[var(--psm-muted)]">{row.totalWorkers} workers · {row.safetyCriticalGaps} gaps</p></div>)}</div>}
    </TrainingCard>
  );
}
