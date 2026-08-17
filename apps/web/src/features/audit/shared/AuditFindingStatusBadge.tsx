import { AuditBadge } from "./AuditUi";
export function AuditFindingStatusBadge({ value }: { value?: string | null | undefined }) {
  const tone = value === "Confirmed" || value === "Ready For CAPA" ? "good" : value === "Rejected" || value === "Archived" ? "danger" : value === "Under Review" || value === "Needs More Information" ? "warn" : "neutral";
  return <AuditBadge tone={tone}>{value ?? "Not Set"}</AuditBadge>;
}
