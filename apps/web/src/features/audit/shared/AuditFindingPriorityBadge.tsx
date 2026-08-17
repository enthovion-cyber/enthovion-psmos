import { AuditBadge } from "./AuditUi";
export function AuditFindingPriorityBadge({ value }: { value?: string | null | undefined }) {
  const tone = value === "Immediate" || value === "Urgent" ? "danger" : value === "High" ? "warn" : value === "Low" ? "good" : "neutral";
  return <AuditBadge tone={tone}>{value ?? "Pending"}</AuditBadge>;
}
