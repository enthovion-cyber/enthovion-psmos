import type { AuditFindingDetail } from "../../types/audit-finding.types";
import { AuditCard, AuditEmptyState } from "../../shared/AuditUi";
import { AuditFindingCapaReadinessBadge } from "../../shared/AuditFindingCapaReadinessBadge";

export function FindingCapaFoundationTab({ detail }: { detail: AuditFindingDetail }) {
  const finding = detail.finding;
  return <AuditCard title="CAPA / Action foundation" subtitle="Ready For CAPA is a controlled foundation state. Full CAPA/action closure is intentionally not duplicated in this phase."><div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><AuditFindingCapaReadinessBadge value={finding.capa_readiness_status} /><p className="mt-3 text-sm text-[var(--psm-muted)]">CAPA required: {finding.capa_required ? "Yes" : "No"} · CAPA record: {finding.capa_record_id ?? "Not linked"}</p><p className="mt-2 text-sm text-[var(--psm-muted)]">{finding.capa_required_reason ?? finding.suggested_corrective_action ?? "No CAPA foundation notes."}</p></div>{detail.capa.length ? detail.capa.map((row) => <div key={row.id} className="mt-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 text-sm text-[var(--psm-muted)]">{row.link_status}: {row.capa_record_id ?? row.action_engine_record_id ?? "Foundation only"}</div>) : <div className="mt-3"><AuditEmptyState title="No CAPA foundation link" message="Mark Ready For CAPA or create a foundation link when the finding is confirmed and ready." /></div>}</AuditCard>;
}
