import { AuditCard, AuditEmptyState } from "../../shared/AuditUi";
import type { AuditReportDetail } from "../../types/audit-report.types";
import { AuditReportPreviewPanel } from "../AuditReportPreviewPanel";
import { AuditReportStaleWarningPanel } from "../AuditReportStaleWarningPanel";
import { AuditReportValidationPanel } from "../AuditReportValidationPanel";
export function ReportOverviewTab({ data }: { data: AuditReportDetail }) {
  return <div className="grid gap-5 xl:grid-cols-2">
    {data.readiness.stale ? <AuditReportStaleWarningPanel data={data} /> : null}
    <AuditReportPreviewPanel preview={data.preview} />
    <AuditReportValidationPanel readiness={data.readiness} validation={data.validation} />
    <AuditCard title="Report Manifest">{Object.keys(data.report.report_manifest_json as Record<string, unknown> ?? {}).length ? <Json data={data.report.report_manifest_json as Record<string, unknown>} /> : <AuditEmptyState title="No manifest yet" message="Generate the report to store a backend manifest." />}</AuditCard>
  </div>;
}
function Json({ data }: { data: unknown }) { return <pre className="max-h-96 overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs text-[var(--psm-muted)]">{JSON.stringify(data, null, 2)}</pre>; }
