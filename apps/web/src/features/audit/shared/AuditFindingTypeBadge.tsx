import { AuditBadge } from "./AuditUi";
export function AuditFindingTypeBadge({ value }: { value?: string | null | undefined }) {
  return <AuditBadge tone={value?.includes("Critical") || value?.includes("Gap") ? "info" : "neutral"}>{value ?? "Unclassified"}</AuditBadge>;
}
