import { AuditBadge } from "./AuditUi";
export function AuditStalePackageBadge({ status }: { status?: string | null | undefined }) {
  const value = status ?? "Current";
  return <AuditBadge tone={value === "Current" ? "good" : "danger"}>{value}</AuditBadge>;
}
