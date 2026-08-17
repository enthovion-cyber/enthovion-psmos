import { AuditBadge } from "./AuditUi";
export function AuditReportAccessStatusBadge({ status }: { status?: string | null | undefined }) {
  return <AuditBadge tone={status === "Allowed" || status === "Logged" ? "good" : status === "Denied" ? "danger" : "warn"}>{status ?? "Logged"}</AuditBadge>;
}
