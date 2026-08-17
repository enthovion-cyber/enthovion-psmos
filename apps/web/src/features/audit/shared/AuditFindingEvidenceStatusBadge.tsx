import { AuditBadge } from "./AuditUi";
export function AuditFindingEvidenceStatusBadge({ value }: { value?: string | null | undefined }) {
  const tone = value === "Missing" ? "danger" : value === "Partial" ? "warn" : value === "Linked" || value === "Attached" || value === "Verified Foundation" ? "good" : value === "Restricted" ? "info" : "neutral";
  return <AuditBadge tone={tone}>{value ?? "Not Required"}</AuditBadge>;
}
