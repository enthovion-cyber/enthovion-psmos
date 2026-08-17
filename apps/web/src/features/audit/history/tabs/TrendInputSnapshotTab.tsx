import { AuditCard } from '../../shared/AuditUi';

export function TrendInputSnapshotTab({ snapshot, methodology }: { snapshot: Record<string, unknown>; methodology: Record<string, unknown> }) {
  return <div className="grid gap-5 xl:grid-cols-2"><AuditCard title="Input Snapshot" subtitle="Immutable backend source input captured at trend-run creation."><pre className="max-h-[560px] overflow-auto whitespace-pre-wrap rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs">{JSON.stringify(snapshot, null, 2)}</pre></AuditCard><AuditCard title="Methodology Snapshot" subtitle="Calculation settings and explainable rule foundation captured with the run."><pre className="max-h-[560px] overflow-auto whitespace-pre-wrap rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs">{JSON.stringify(methodology, null, 2)}</pre></AuditCard></div>;
}
