import { AuditCard } from "../shared/AuditUi";
import { AuditComplianceResultBadge } from "../shared/AuditComplianceResultBadge";
import type { AuditExecutionResponse } from "../types/audit-execution.types";

export function AuditResponseStatusPanel({ responses }: { responses: AuditExecutionResponse[] }) {
  return <AuditCard title="Response Status Panel"><div className="flex flex-wrap gap-2">{responses.length ? responses.map((response) => <AuditComplianceResultBadge key={response.id} result={response.compliance_result} />) : <p className="text-sm text-[var(--psm-muted)]">No responses captured.</p>}</div></AuditCard>;
}
