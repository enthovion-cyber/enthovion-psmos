import { AuditReportStatusBadge } from "../shared/AuditReportStatusBadge";
import type { AuditReportRow } from "../types/audit-report.types";
export function AuditReportMobileCards({ rows }: { rows: AuditReportRow[] }) {
  return <div className="grid gap-3 md:hidden">{rows.map((row) => <a key={row.id} href={`/audit-compliance/reports/${row.id}`} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-primary">{row.report_code}</p><p className="text-sm text-[var(--psm-muted)]">{row.report_title}</p></div><AuditReportStatusBadge status={row.report_status} /></div></a>)}</div>;
}
