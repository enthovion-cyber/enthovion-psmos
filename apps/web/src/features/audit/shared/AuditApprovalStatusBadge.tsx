import { AuditBadge } from "./AuditUi";
export function AuditApprovalStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status ?? "Unknown";
  const tone = value.includes("Approved") || value === "Completed" ? "good" : value === "Rejected" || value === "Validation Failed" ? "danger" : value === "Returned" || value === "Stale" ? "warn" : "info";
  return <AuditBadge tone={tone}>{value}</AuditBadge>;
}
