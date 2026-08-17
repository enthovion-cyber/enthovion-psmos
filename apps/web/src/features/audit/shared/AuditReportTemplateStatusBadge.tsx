import { AuditBadge } from "./AuditUi";
export function AuditReportTemplateStatusBadge({ status }: { status?: string | null | undefined }) {
  return <AuditBadge tone={status === "Approved" || status === "Active" ? "good" : status === "Archived" ? "danger" : "warn"}>{status ?? "Draft"}</AuditBadge>;
}
