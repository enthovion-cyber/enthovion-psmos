import { AuditBadge } from "./AuditUi";
export function AuditScoringModelStatusBadge({ value }: { value?: string | null | undefined }) {
  const tone = value === "Active" || value === "Approved" ? "good" : value === "Archived" || value === "Superseded" ? "danger" : value === "Pending Review" ? "warn" : "neutral";
  return <AuditBadge tone={tone}>{value ?? "Draft"}</AuditBadge>;
}
