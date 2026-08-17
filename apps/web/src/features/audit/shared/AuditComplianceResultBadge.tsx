import { AuditBadge } from "./AuditUi";

export function AuditComplianceResultBadge({ result }: { result?: string | null | undefined }) {
  const tone = result === "Compliant" ? "good" : result === "Non-Compliant" ? "danger" : result === "Partially Compliant" ? "warn" : "neutral";
  return <AuditBadge tone={tone}>{result ?? "Not Verified"}</AuditBadge>;
}
