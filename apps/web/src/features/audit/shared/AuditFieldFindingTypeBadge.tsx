import { AuditBadge } from "./AuditUi";

export function AuditFieldFindingTypeBadge({ type }: { type?: string | null }) {
  const tone = type?.includes("Safety") || type?.includes("Regulatory") ? "danger" : type?.includes("Observation") ? "info" : "neutral";
  return <AuditBadge tone={tone}>{type ?? "Finding"}</AuditBadge>;
}
