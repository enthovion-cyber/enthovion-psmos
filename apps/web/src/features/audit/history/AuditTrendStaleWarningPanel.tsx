import { AuditButton, AuditCard } from '../shared/AuditUi';
import type { AuditTrendRun } from '../types/audit-trend.types';

export function AuditTrendStaleWarningPanel({ run, staleness }: { run: AuditTrendRun; staleness?: Array<Record<string, unknown>> }) {
  if (!run.stale_status || run.stale_status === 'Current') return null;
  return <AuditCard title="Stale Trend Warning" subtitle={run.stale_reason ?? 'Source data changed or this trend is no longer current.'} action={<AuditButton href={`/audit-compliance/history/trends/runs/${run.id}/history`} variant="secondary">Open Trend History</AuditButton>}><div className="grid gap-2 text-sm">{(staleness ?? []).map((event) => <div key={String(event.id)} className="rounded-lg bg-danger/10 p-3 text-danger">{String(event.stale_reason ?? event.stale_trigger_type ?? 'Trend stale')}</div>)}</div></AuditCard>;
}
