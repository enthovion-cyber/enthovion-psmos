import { TrainingCard, TrainingEmptyState, TrainingProgress } from '../shared/TrainingUi';

export function TrainingReadinessBySite({ rows = [] }: { rows?: Array<Record<string, any>> }) {
  return (
    <TrainingCard title="Training Readiness by Site" subtitle="Backend-generated readiness from scoped worker foundation statuses.">
      {!rows.length ? <TrainingEmptyState title="No site readiness yet" message="Create workforce records and assign primary sites to generate site readiness." /> : <div className="space-y-3">{rows.map((row) => <div key={row.siteId ?? 'missing'} className="rounded-lg border border-[var(--psm-line)] p-3"><div className="flex justify-between gap-3 text-sm"><span className="font-semibold">{row.siteName}</span><span>{row.readinessPercent}%</span></div><div className="mt-2"><TrainingProgress value={row.readinessPercent} /></div><p className="mt-2 text-xs text-[var(--psm-muted)]">{row.totalWorkers} workers · {row.safetyCriticalGaps} safety-critical gaps</p></div>)}</div>}
    </TrainingCard>
  );
}
