import { AuditBadge } from "./AuditUi";

export function AuditFieldFindingStatusBadge({ status }: { status?: string | null }) {
  const tone = status === "Converted" || status === "Accepted" ? "good" : status === "Cancelled" ? "neutral" : status === "Ready For Finding Register" ? "info" : "warn";
  return <AuditBadge tone={tone}>{status ?? "Draft"}</AuditBadge>;
}
