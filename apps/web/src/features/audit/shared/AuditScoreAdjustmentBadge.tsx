import { AuditBadge } from "./AuditUi";
export function AuditScoreAdjustmentBadge({ value }: { value?: string | null | undefined }) {
  const tone = value === "Approved" ? "good" : value === "Rejected" || value === "Removed" ? "danger" : value === "Pending Approval" ? "warn" : "neutral";
  return <AuditBadge tone={tone}>{value ?? "No adjustment"}</AuditBadge>;
}
