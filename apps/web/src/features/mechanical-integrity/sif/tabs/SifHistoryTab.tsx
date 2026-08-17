import { SectionCard } from '../../safeguards/SafeguardUiPrimitives';
export function SifHistoryTab({ events }: { events?: any[] }) {
  return <SectionCard title="SIF History" description="Immutable safeguard lifecycle events, audit trace, imports, tests, bypasses, demands, and status changes."><div className="space-y-3">{events?.length ? events.map((event) => <div key={event.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="font-semibold">{event.event_title ?? event.event_type}</p><p className="text-sm text-[var(--psm-muted)]">{event.event_description ?? event.created_at}</p></div>) : <p className="text-sm text-[var(--psm-muted)]">No history events returned by backend.</p>}</div></SectionCard>;
}
