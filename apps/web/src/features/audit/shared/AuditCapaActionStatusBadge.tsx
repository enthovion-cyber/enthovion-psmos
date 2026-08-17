import { AuditBadge } from "./AuditUi";

export function AuditCapaActionStatusBadge({ value }: { value?: string | null }) {
  const text = value ?? "Draft";
  const tone = ["Verified", "Completed", "Closed"].includes(text) ? "good" : ["Rejected", "Overdue", "Cancelled"].includes(text) ? "danger" : ["Submitted For Verification", "Waiting Evidence", "Reopened"].includes(text) ? "warn" : "info";
  return <AuditBadge tone={tone}>{text}</AuditBadge>;
}
