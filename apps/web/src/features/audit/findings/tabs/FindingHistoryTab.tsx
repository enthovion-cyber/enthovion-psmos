import type { AuditFindingDetail } from "../../types/audit-finding.types";
import { AuditCard, AuditEmptyState } from "../../shared/AuditUi";

export function FindingHistoryTab({ detail }: { detail: AuditFindingDetail }) {
  return <AuditCard title="Audit finding history events" subtitle="Immutable backend history and central audit log hooks are created for every finding mutation.">{detail.history.length ? <div className="space-y-3">{detail.history.map((row) => <div key={row.id} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><h3 className="font-semibold text-[var(--psm-fg)]">{row.event_title}</h3><p className="mt-1 text-sm text-[var(--psm-muted)]">{row.event_description}</p><p className="mt-2 text-xs text-[var(--psm-muted)]">{row.event_type} · {row.created_at}</p></div>)}</div> : <AuditEmptyState title="No history events" message="History events appear after create, update, classify, evidence link, ownership assign, review, duplicate check, confirm, reject, reopen, archive, or Ready For CAPA actions." />}</AuditCard>;
}
