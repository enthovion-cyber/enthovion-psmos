import { AuditBadge } from "./AuditUi";
export function AuditScoreGradeBadge({ value }: { value?: string | null | undefined }) {
  const tone = value === "A" || value === "B" ? "good" : value === "C" ? "warn" : value === "D" || value === "F" ? "danger" : "neutral";
  return <AuditBadge tone={tone}>{value ?? "Not Determined"}</AuditBadge>;
}
