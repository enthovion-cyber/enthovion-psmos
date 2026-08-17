import Link from "next/link";
import { AuditReportReadinessBadge } from "../shared/AuditReportReadinessBadge";
import { AuditReportStaleBadge } from "../shared/AuditReportStaleBadge";
import { AuditReportStatusBadge } from "../shared/AuditReportStatusBadge";
import { AuditReportTypeBadge } from "../shared/AuditReportTypeBadge";
import type { AuditReportRow } from "../types/audit-report.types";

export function AuditReportTable({ rows }: { rows: AuditReportRow[] }) {
  return <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)]">
    <table className="min-w-full divide-y divide-[var(--psm-line)] text-sm">
      <thead className="bg-[var(--psm-surface-2)] text-left text-xs uppercase tracking-[.12em] text-[var(--psm-muted)]">
        <tr><th className="p-3">Report</th><th className="p-3">Type</th><th className="p-3">Status</th><th className="p-3">Readiness</th><th className="p-3">Stale</th><th className="p-3">Source</th><th className="p-3">Audience</th><th className="p-3">Generated</th></tr>
      </thead>
      <tbody className="divide-y divide-[var(--psm-line)]">
        {rows.map((row) => <tr key={row.id} className="bg-[var(--psm-surface)] align-top">
          <td className="p-3"><Link href={`/audit-compliance/reports/${row.id}`} className="font-semibold text-primary">{row.report_code}</Link><p className="mt-1 max-w-sm text-[var(--psm-muted)]">{row.report_title}</p>{row.restricted ? <p className="mt-1 text-xs font-semibold text-amber-600">Restricted</p> : null}</td>
          <td className="p-3"><AuditReportTypeBadge type={row.report_type} /></td>
          <td className="p-3"><AuditReportStatusBadge status={row.report_status} /></td>
          <td className="p-3"><AuditReportReadinessBadge status={row.readiness_status} /></td>
          <td className="p-3"><AuditReportStaleBadge status={row.stale_status} /></td>
          <td className="p-3"><p>{row.source_module ?? "Source"}</p><p className="text-xs text-[var(--psm-muted)]">{row.source_record_number ?? row.source_record_title ?? "Not linked"}</p></td>
          <td className="p-3">{row.intended_audience ?? "Internal"}</td>
          <td className="p-3">{row.generated_at ? new Date(row.generated_at).toLocaleString() : "Not generated"}</td>
        </tr>)}
      </tbody>
    </table>
  </div>;
}
