import { AuditCard, AuditEmptyState } from "../../shared/AuditUi";
import { AuditEvidenceStatusBadge } from "../../shared/AuditEvidenceStatusBadge";
import type { AuditExecutionEvidence } from "../../types/audit-execution.types";

export function ExecutionEvidencePanel({ evidence }: { evidence: AuditExecutionEvidence[] }) {
  return <AuditCard title="Evidence Links" subtitle="Document Control, storage, and related record evidence linked through backend evidence records.">{evidence.length ? <div className="space-y-2">{evidence.map((item) => <div key={item.id} className="rounded-lg border border-[var(--psm-line)] p-3"><div className="flex flex-wrap justify-between gap-2"><p className="font-semibold text-[var(--psm-fg)]">{item.evidence_title}</p><AuditEvidenceStatusBadge status={item.evidence_status} /></div><p className="text-sm text-[var(--psm-muted)]">{item.evidence_type} - {item.confidentiality_level ?? "Internal"}</p></div>)}</div> : <AuditEmptyState title="No evidence linked" message="No evidence records were returned by the backend for this execution." />}</AuditCard>;
}
