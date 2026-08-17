import { AuditBadge } from "./AuditUi";
export function AuditReportStaleBadge({ status }: { status?: string | null | undefined }) {
  const current = !status || status === "Current";
  return <AuditBadge tone={current ? "good" : status === "Approved Historical" ? "info" : "warn"}>{status ?? "Current"}</AuditBadge>;
}
