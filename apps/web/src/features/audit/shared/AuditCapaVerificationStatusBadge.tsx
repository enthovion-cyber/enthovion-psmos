import { AuditBadge } from "./AuditUi";

export function AuditCapaVerificationStatusBadge({ value }: { value?: string | null }) {
  const text = value ?? "Not Required";
  const tone = text === "Verified" ? "good" : ["Rejected", "Rework Required"].includes(text) ? "danger" : ["Pending Verification", "Required"].includes(text) ? "warn" : "neutral";
  return <AuditBadge tone={tone}>{text}</AuditBadge>;
}
