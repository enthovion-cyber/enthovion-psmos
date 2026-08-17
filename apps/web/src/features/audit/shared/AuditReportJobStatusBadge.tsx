import { AuditBadge } from "./AuditUi";
export function AuditReportJobStatusBadge({ status }: { status?: string | null | undefined }) {
  return <AuditBadge tone={status === "Completed" ? "good" : status === "Failed" || status === "Cancelled" ? "danger" : "warn"}>{status ?? "Queued"}</AuditBadge>;
}
