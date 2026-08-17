import { AuditBadge } from "./AuditUi";

export function AuditCapaOverdueBadge({ count = 0 }: { count?: number }) {
  return <AuditBadge tone={count > 0 ? "danger" : "good"}>{count > 0 ? `${count} overdue` : "Not overdue"}</AuditBadge>;
}
