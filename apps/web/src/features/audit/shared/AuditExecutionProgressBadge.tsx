import { AuditBadge } from "./AuditUi";

export function AuditExecutionProgressBadge({ value }: { value?: number | null }) {
  const percent = Number(value ?? 0);
  const tone = percent >= 100 ? "good" : percent > 0 ? "info" : "neutral";
  return <AuditBadge tone={tone}>{percent}% complete</AuditBadge>;
}
