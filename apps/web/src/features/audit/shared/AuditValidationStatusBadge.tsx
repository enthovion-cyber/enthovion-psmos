import { AuditBadge } from "./AuditUi";
export function AuditValidationStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status ?? "Not Run";
  const tone = value === "Passed" ? "good" : value === "Failed" ? "danger" : value === "Warning" ? "warn" : "neutral";
  return <AuditBadge tone={tone}>{value}</AuditBadge>;
}
