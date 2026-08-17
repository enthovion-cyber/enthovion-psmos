import { AuditCard, AuditEmptyState } from "../../shared/AuditUi";
import { AuditFieldFindingStatusBadge } from "../../shared/AuditFieldFindingStatusBadge";
import { AuditFindingSeverityBadge } from "../../shared/AuditFindingSeverityBadge";
import type { AuditFieldFinding } from "../../types/audit-execution.types";

export function ExecutionFindingPanel({ findings }: { findings: AuditFieldFinding[] }) {
  return <AuditCard title="Field Findings" subtitle="Execution-only field findings that can be converted to the finding register/action engine foundation.">{findings.length ? <div className="space-y-2">{findings.map((finding) => <div key={finding.id} className="rounded-lg border border-[var(--psm-line)] p-3"><div className="flex flex-wrap justify-between gap-2"><p className="font-semibold text-[var(--psm-fg)]">{finding.finding_title}</p><div className="flex gap-2"><AuditFindingSeverityBadge value={finding.criticality} /><AuditFieldFindingStatusBadge status={finding.field_finding_status} /></div></div><p className="mt-1 text-sm text-[var(--psm-muted)]">{finding.finding_description}</p></div>)}</div> : <AuditEmptyState title="No field findings" message="No backend field findings exist for this execution." />}</AuditCard>;
}
