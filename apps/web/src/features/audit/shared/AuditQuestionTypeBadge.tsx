import { AuditBadge } from "./AuditUi";
export function AuditQuestionTypeBadge({ value }: { value: string }) {
  return <AuditBadge tone="info">{value}</AuditBadge>;
}
