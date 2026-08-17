import { AuditBadge } from "./AuditUi";

export function AuditCapaPriorityBadge({ value }: { value?: string | null }) {
  const text = value ?? "Not Set";
  const tone = ["Immediate", "Urgent"].includes(text) ? "danger" : text === "High" ? "warn" : text === "Medium" ? "info" : "neutral";
  return <AuditBadge tone={tone}>{text}</AuditBadge>;
}
