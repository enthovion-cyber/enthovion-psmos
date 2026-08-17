import { AuditBadge } from "./AuditUi";

export function AuditCapaClosureReadinessBadge({ value }: { value?: string | null }) {
  const text = value ?? "Not Ready";
  const tone = text === "Ready For Closure" || text === "Closed" ? "good" : text === "Not Ready" || text === "Missing CAPA" || text === "Rework Required" ? "danger" : "warn";
  return <AuditBadge tone={tone}>{text}</AuditBadge>;
}
