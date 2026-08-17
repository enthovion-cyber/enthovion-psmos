import { AuditCard } from "../shared/AuditUi";
import type { AuditReportDetail } from "../types/audit-report.types";
export function AuditReportStaleWarningPanel({ data }: { data: AuditReportDetail }) {
  return <AuditCard title="Stale Report Warning" subtitle="Source changed or report is no longer current."><p className="text-sm text-amber-700 dark:text-amber-200">{String(data.report.stale_reason ?? "This report must be regenerated or intentionally marked historical with a reason.")}</p></AuditCard>;
}
