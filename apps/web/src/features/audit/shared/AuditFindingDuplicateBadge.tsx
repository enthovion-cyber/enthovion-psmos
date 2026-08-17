import { AuditBadge } from "./AuditUi";
export function AuditFindingDuplicateBadge({ value }: { value?: string | null | undefined }) {
  const tone = value === "Potential Duplicate" || value === "Repeat Finding" || value === "Recurring Finding" ? "warn" : value === "New Finding" ? "good" : "neutral";
  return <AuditBadge tone={tone}>{value ?? "Not Checked"}</AuditBadge>;
}
