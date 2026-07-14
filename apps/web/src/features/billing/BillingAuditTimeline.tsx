import type { BillingAuditEvent } from './types/billing.types';

export function BillingAuditTimeline({ events }: { events: BillingAuditEvent[] }) {
  return <div className="psm-panel rounded-xl p-5"><h2 className="text-lg font-semibold">Billing audit activity</h2><div className="mt-4 space-y-3">{events.length === 0 ? <div className="text-sm text-[var(--psm-muted)]">No billing audit events yet.</div> : null}{events.map((event) => <div key={event.id} className="border-l-2 border-info pl-3"><div className="text-sm font-medium">{event.action}</div><div className="text-xs text-[var(--psm-muted)]">{event.target_type} · {new Date(event.created_at).toLocaleString()}</div></div>)}</div></div>;
}
