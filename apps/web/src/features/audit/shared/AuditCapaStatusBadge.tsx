import { AuditBadge } from "./AuditUi";

export function AuditCapaStatusBadge({ value }: { value?: string | null }) {
  const text = value ?? "Not Set";
  const tone = ["Ready For Closure", "Closed", "Completed", "Effective"].includes(text) ? "good" : ["Overdue", "Verification Failed", "Ineffective", "Rejected", "Archived"].includes(text) ? "danger" : ["Pending Verification", "Effectiveness Check Pending", "Reopened", "Pending Evidence"].includes(text) ? "warn" : "info";
  return <AuditBadge tone={tone}>{text}</AuditBadge>;
}
