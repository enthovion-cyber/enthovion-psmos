import { AuditBadge } from "./AuditUi";

export function AuditCapaEffectivenessStatusBadge({ value }: { value?: string | null }) {
  const text = value ?? "Not Required";
  const tone = text === "Effective" ? "good" : text === "Ineffective" || text === "Overdue" ? "danger" : ["Pending", "Scheduled", "Required", "Needs Follow-Up"].includes(text) ? "warn" : "neutral";
  return <AuditBadge tone={tone}>{text}</AuditBadge>;
}
