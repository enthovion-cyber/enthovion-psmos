import { AuditBadge } from "./AuditUi";
export function AuditApprovalConditionStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status ?? "Open";
  const tone = value === "Verified" || value === "Completed" ? "good" : value === "Rejected" ? "danger" : "warn";
  return <AuditBadge tone={tone}>{value}</AuditBadge>;
}
