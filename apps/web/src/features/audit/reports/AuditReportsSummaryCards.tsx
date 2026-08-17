import { AuditMetricCard } from "../shared/AuditUi";
import type { AuditReportSummary } from "../types/audit-report.types";

export function AuditReportsSummaryCards({ summary }: { summary?: AuditReportSummary }) {
  const s = summary ?? { total: 0, draft: 0, generated: 0, pendingApproval: 0, approved: 0, locked: 0, stale: 0, failed: 0, exported: 0, archived: 0, downloadsTracked: 0, restricted: 0 };
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
    <AuditMetricCard label="Reports" value={s.total} href="/audit-compliance/reports/register" />
    <AuditMetricCard label="Generated" value={s.generated} tone="good" href="/audit-compliance/reports/generated" />
    <AuditMetricCard label="Pending Approval" value={s.pendingApproval} tone={s.pendingApproval ? "warn" : "neutral"} href="/audit-compliance/reports/pending-approval" />
    <AuditMetricCard label="Locked / Official" value={s.locked} tone="info" href="/audit-compliance/reports/locked" />
    <AuditMetricCard label="Stale" value={s.stale} tone={s.stale ? "warn" : "good"} href="/audit-compliance/reports/stale" />
    <AuditMetricCard label="Failed Jobs" value={s.failed} tone={s.failed ? "danger" : "good"} href="/audit-compliance/reports/failed" />
    <AuditMetricCard label="Draft" value={s.draft} href="/audit-compliance/reports/draft" />
    <AuditMetricCard label="Approved" value={s.approved} tone="good" href="/audit-compliance/reports/approved" />
    <AuditMetricCard label="Exported" value={s.exported} tone="good" href="/audit-compliance/reports/exported" />
    <AuditMetricCard label="Downloads" value={s.downloadsTracked} href="/audit-compliance/reports/downloads" />
    <AuditMetricCard label="Restricted" value={s.restricted} tone={s.restricted ? "warn" : "neutral"} href="/audit-compliance/reports/access-log" />
    <AuditMetricCard label="Archived" value={s.archived} href="/audit-compliance/reports/archived" />
  </div>;
}
