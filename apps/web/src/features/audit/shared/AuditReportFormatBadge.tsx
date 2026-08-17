import { AuditBadge } from "./AuditUi";
export function AuditReportFormatBadge({ format }: { format?: string | null | undefined }) {
  return <AuditBadge>{format ?? "Format"}</AuditBadge>;
}
