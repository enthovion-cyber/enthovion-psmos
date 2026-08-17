import { AuditBadge } from "./AuditUi";
export function AuditFindingCriticalityBadge({ value }: { value?: string | null | undefined }) {
  const tone = value?.includes("Critical") ? "danger" : value === "High" ? "warn" : value === "Low" ? "good" : "neutral";
  return <AuditBadge tone={tone}>{value ?? "Medium"}</AuditBadge>;
}
