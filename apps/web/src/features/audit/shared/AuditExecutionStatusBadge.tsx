import { AuditBadge } from "./AuditUi";

export function AuditExecutionStatusBadge({ status }: { status?: string | null }) {
  const tone = status === "Completed" ? "good" : status === "Blocked" || status === "Cancelled" ? "danger" : status === "Paused" ? "warn" : status === "In Progress" ? "info" : "neutral";
  return <AuditBadge tone={tone}>{status ?? "Not Started"}</AuditBadge>;
}
