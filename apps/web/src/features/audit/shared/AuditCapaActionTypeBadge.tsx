import { AuditBadge } from "./AuditUi";

export function AuditCapaActionTypeBadge({ value }: { value?: string | null }) {
  const text = value ?? "Action";
  const tone = text.includes("Corrective") ? "danger" : text.includes("Preventive") || text.includes("Systemic") ? "info" : text.includes("Containment") ? "warn" : "neutral";
  return <AuditBadge tone={tone}>{text}</AuditBadge>;
}
