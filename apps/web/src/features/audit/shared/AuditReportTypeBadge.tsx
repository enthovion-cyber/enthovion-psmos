import { AuditBadge } from "./AuditUi";
export function AuditReportTypeBadge({ type }: { type?: string | null | undefined }) {
  return <AuditBadge tone="info">{type ?? "Report"}</AuditBadge>;
}
