import { AuditCard } from "../../shared/AuditUi";
import { AuditChecklistResponseStatusBadge } from "../../shared/AuditChecklistResponseStatusBadge";
import { AuditComplianceResultBadge } from "../../shared/AuditComplianceResultBadge";
import type { AuditExecutionItem, AuditExecutionResponse } from "../../types/audit-execution.types";
import { ExecutionResponseForm } from "./ExecutionResponseForm";

export function ExecutionItemPanel({ executionId, item, response }: { executionId: string; item: AuditExecutionItem; response?: AuditExecutionResponse | undefined }) {
  return (
    <AuditCard title={`${item.item_code} - ${item.item_text}`} subtitle={item.guidance_text ?? item.expected_evidence ?? undefined} action={<div className="flex gap-2"><AuditChecklistResponseStatusBadge status={response?.response_status ?? item.item_status} /><AuditComplianceResultBadge result={response?.compliance_result} /></div>}>
      <div className="flex flex-wrap gap-2 text-xs text-[var(--psm-muted)]"><span>{item.question_type}</span><span>{item.response_type}</span>{item.safety_critical ? <span>Safety critical</span> : null}{item.regulatory_critical ? <span>Regulatory critical</span> : null}{item.mandatory_evidence ? <span>Evidence required</span> : null}</div>
      <ExecutionResponseForm executionId={executionId} item={item} response={response} />
    </AuditCard>
  );
}
