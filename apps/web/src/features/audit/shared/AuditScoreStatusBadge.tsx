import { AuditBadge } from "./AuditUi";
export function AuditScoreStatusBadge({ value }: { value?: string | null | undefined }) {
  const tone = value === "Locked" || value === "Verified" ? "good" : value === "Failed" || value === "Input Missing" ? "danger" : value === "Pending Verification" || value === "Needs Recalculation" ? "warn" : "info";
  return <AuditBadge tone={tone}>{value ?? "Not scored"}</AuditBadge>;
}
