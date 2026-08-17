import { AuditBadge } from "./AuditUi";
export function AuditScoreStaleBadge({ value }: { value?: string | null | undefined }) {
  const tone = value === "Current" ? "good" : value === "Stale" || value === "Superseded" ? "danger" : "warn";
  return <AuditBadge tone={tone}>{value ?? "Stale status unknown"}</AuditBadge>;
}
