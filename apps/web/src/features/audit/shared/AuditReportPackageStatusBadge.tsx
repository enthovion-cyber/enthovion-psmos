import { AuditBadge } from "./AuditUi";
export function AuditReportPackageStatusBadge({ status }: { status?: string | null | undefined }) {
  return <AuditBadge tone={status === "Prepared" || status === "Exported" ? "good" : status === "Failed" ? "danger" : "warn"}>{status ?? "Draft"}</AuditBadge>;
}
