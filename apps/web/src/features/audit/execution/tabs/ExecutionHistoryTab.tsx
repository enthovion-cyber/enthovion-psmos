import { AuditCard, AuditEmptyState } from "../../shared/AuditUi";
import type { AuditExecutionDetail } from "../../types/audit-execution.types";

export function ExecutionHistoryTab({ detail }: { detail: AuditExecutionDetail }) {
  return <AuditCard title="Immutable Execution History" subtitle="Backend audit execution history and activity events. Normal users cannot edit these rows.">{detail.history.length ? <ol className="space-y-2">{detail.history.slice().reverse().map((event) => <li key={event.id} className="rounded-lg border border-[var(--psm-line)] p-3"><p className="font-semibold text-[var(--psm-fg)]">{event.event_title}</p><p className="text-sm text-[var(--psm-muted)]">{event.event_type} - {event.created_at ? new Date(event.created_at).toLocaleString() : "No timestamp"}</p></li>)}</ol> : <AuditEmptyState title="No history events" message="No immutable backend history events were returned for this execution." />}</AuditCard>;
}
