import { AuditBadge } from "./AuditUi";
export function AuditSlaStatusBadge({ overdue }: { overdue?: boolean | null | undefined }) {
  return <AuditBadge tone={overdue ? "danger" : "good"}>{overdue ? "Overdue" : "On Track"}</AuditBadge>;
}
