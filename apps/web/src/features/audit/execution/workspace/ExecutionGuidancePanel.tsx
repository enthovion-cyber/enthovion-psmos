import { AuditCard } from "../../shared/AuditUi";
import type { AuditExecutionItem } from "../../types/audit-execution.types";

export function ExecutionGuidancePanel({ item }: { item?: AuditExecutionItem | undefined }) {
  return <AuditCard title="Execution Guidance" subtitle="Checklist guidance, expected evidence, and response constraints from the approved checklist snapshot."><div className="space-y-2 text-sm text-[var(--psm-muted)]"><p>{item?.guidance_text ?? "Select a checklist item to view backend checklist guidance."}</p>{item?.expected_evidence ? <p><span className="font-semibold text-[var(--psm-fg)]">Expected evidence:</span> {item.expected_evidence}</p> : null}</div></AuditCard>;
}
