import { AuditBadge } from "./AuditUi";
export function AuditFindingReviewStatusBadge({ value }: { value?: string | null | undefined }) {
  const tone = value === "Approved / Confirmed" ? "good" : value === "Rejected" ? "danger" : value === "Pending Review" || value === "Under Review" || value === "Returned" ? "warn" : "neutral";
  return <AuditBadge tone={tone}>{value ?? "Not Required"}</AuditBadge>;
}
