import { AuditCard, AuditEmptyState } from "../../shared/AuditUi";

export function ExecutionActivityPanel({ activity }: { activity: Record<string, any>[] }) {
  return <AuditCard title="Recent Activity">{activity.length ? <ol className="space-y-2">{activity.slice(-8).reverse().map((event) => <li key={event.id} className="rounded-lg border border-[var(--psm-line)] p-3 text-sm"><p className="font-semibold text-[var(--psm-fg)]">{event.event_title}</p><p className="text-[var(--psm-muted)]">{event.event_type} - {event.created_at ? new Date(event.created_at).toLocaleString() : "No timestamp"}</p></li>)}</ol> : <AuditEmptyState title="No activity" message="No immutable activity events were returned by the backend." />}</AuditCard>;
}
