import { AuditBadge } from "./AuditUi";
export function AuditEsignatureStatusBadge({ status, required }: { status?: string | null | undefined; required?: boolean | null | undefined }) {
  const value = status ?? (required ? "Pending" : "Not Required");
  const tone = value === "Signed" || value === "Not Required" ? "good" : value === "Failed" || value === "Expired" ? "danger" : "warn";
  return <AuditBadge tone={tone}>{value}</AuditBadge>;
}
