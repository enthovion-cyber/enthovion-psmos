import { AuditCard } from "../shared/AuditUi";
import { AuditValidationStatusBadge } from "../shared/AuditValidationStatusBadge";
export function AuditApprovalValidationPanel({ rows = [] }: { rows?: Record<string, unknown>[] }) {
  return <AuditCard title="Approval Validation">{rows.map((row, index) => <div key={String(row.id ?? index)} className="mb-2 flex justify-between rounded-lg bg-[var(--psm-surface-2)] p-3"><span>{String(row.validation_type ?? row.check_name ?? "Validation")}</span><AuditValidationStatusBadge status={String(row.validation_status ?? "Not Run")} /></div>)}</AuditCard>;
}
