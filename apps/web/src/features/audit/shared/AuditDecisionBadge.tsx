import { AuditBadge } from "./AuditUi";
export function AuditDecisionBadge({ decision }: { decision?: string | null | undefined }) {
  const value = decision ?? "No Decision";
  const tone = value.includes("Approve") ? "good" : value === "Reject" ? "danger" : value === "Return" ? "warn" : "neutral";
  return <AuditBadge tone={tone}>{value}</AuditBadge>;
}
