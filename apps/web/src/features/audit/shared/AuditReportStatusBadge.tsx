import { AuditBadge } from "./AuditUi";
export function AuditReportStatusBadge({ status }: { status?: string | null | undefined }) {
  const tone = status === "Approved" || status === "Generated" || status === "Exported" ? "good" : status === "Failed" || status === "Archived" ? "danger" : status === "Stale" || status === "Pending Approval" ? "warn" : "neutral";
  return <AuditBadge tone={tone}>{status ?? "Unknown"}</AuditBadge>;
}
