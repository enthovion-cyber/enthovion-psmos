import type { AuditDetail } from '../../types/audit.types';
import { AuditCard, AuditEmptyState } from '../../shared/AuditUi';

export function ProgramHistoryTab({ detail }: { detail: AuditDetail }) {
  return <AuditCard title="Audit Program History" subtitle="Immutable Audit module history events linked to shared audit log mutations.">{detail.history.length ? <div className="space-y-3">{detail.history.map((event) => <div key={event.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><div className="flex flex-wrap justify-between gap-2"><b>{event.event_title}</b><span className="text-xs text-[var(--psm-muted)]">{new Date(event.created_at).toLocaleString()}</span></div><p className="mt-1 text-sm text-[var(--psm-muted)]">{event.event_type} | {event.event_description}</p></div>)}</div> : <AuditEmptyState title="No history yet" message="Create/update/archive/reactivate/status changes will create backend history events." />}</AuditCard>;
}
