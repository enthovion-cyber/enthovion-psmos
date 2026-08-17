import { AuditBadge } from "./AuditUi";
export function AuditReportReadinessBadge({ status }: { status?: string | null | undefined }) {
  const tone = status === "Ready" || status === "Ready For Export" || status === "Ready For Approval" ? "good" : status === "Blocked" || status === "Not Ready" ? "danger" : "warn";
  return <AuditBadge tone={tone}>{status ?? "Not Checked"}</AuditBadge>;
}
