import { AuditBadge } from "./AuditUi";
export function AuditFindingOverdueBadge({ overdue }: { overdue?: boolean | undefined }) {
  return <AuditBadge tone={overdue ? "danger" : "good"}>{overdue ? "Overdue" : "On Track"}</AuditBadge>;
}
