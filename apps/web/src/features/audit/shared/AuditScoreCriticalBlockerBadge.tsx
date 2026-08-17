import { AuditBadge } from "./AuditUi";
export function AuditScoreCriticalBlockerBadge({ count = 0 }: { count?: number }) {
  return <AuditBadge tone={count > 0 ? "danger" : "good"}>{count > 0 ? `${count} blockers` : "No blockers"}</AuditBadge>;
}
