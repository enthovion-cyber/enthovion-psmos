import { AuditBadge } from "./AuditUi";
export function AuditScoreReadinessBadge({ value }: { value?: string | null | undefined }) {
  const tone = value === "Ready" ? "good" : value === "Blocked" || value === "Input Missing" ? "danger" : value === "Warning" || value === "Review Required" ? "warn" : "neutral";
  return <AuditBadge tone={tone}>{value ?? "Unknown readiness"}</AuditBadge>;
}
