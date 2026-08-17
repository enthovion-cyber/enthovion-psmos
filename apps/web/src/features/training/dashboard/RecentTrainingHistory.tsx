import { TrainingCard, TrainingEmptyState } from '../shared/TrainingUi';

export function RecentTrainingHistory({ rows = [] }: { rows?: Array<Record<string, any>> }) {
  return (
    <TrainingCard title="Recent Training History Events" subtitle="Immutable Training history foundation events.">
      {!rows.length ? <TrainingEmptyState title="No history yet" message="Worker creation, updates, assignments, account links, document links, archives, and recalculations will appear here." /> : <div className="space-y-3">{rows.map((event) => <div key={event.id} className="rounded-lg border border-[var(--psm-line)] p-3"><div className="flex justify-between gap-3"><p className="font-semibold">{event.event_title}</p><p className="text-xs text-[var(--psm-muted)]">{event.created_at ? new Date(event.created_at).toLocaleString() : ''}</p></div><p className="mt-1 text-sm text-[var(--psm-muted)]">{event.event_type} · {event.source_module}</p></div>)}</div>}
    </TrainingCard>
  );
}
