'use client';

import { TrainingCard, TrainingEmptyState } from '../../../shared/TrainingUi';

export function SessionHistoryTab({ rows }: { rows: Record<string, any>[] }) {
  return <TrainingCard title="Change History">{!rows.length ? <TrainingEmptyState title="No history events" message="Session history is immutable and will populate after audited mutations." /> : <div className="space-y-2">{rows.map((row) => <div key={row.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm"><b>{row.event_title ?? row.event_type}</b><p className="text-[var(--psm-muted)]">{row.event_description ?? row.created_at}</p></div>)}</div>}</TrainingCard>;
}
