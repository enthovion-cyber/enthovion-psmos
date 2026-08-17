import { AuditBadge } from "./AuditUi";
export function AuditFindingCapaReadinessBadge({ value }: { value?: string | null | undefined }) {
  const tone = value === "Ready For CAPA" || value === "CAPA Created Foundation" ? "good" : value?.startsWith("Missing") || value === "Needs Confirmation" ? "warn" : "neutral";
  return <AuditBadge tone={tone}>{value ?? "Not Ready"}</AuditBadge>;
}
