import Link from "next/link";
import { AuditButton, AuditCard } from "../shared/AuditUi";
import { AuditReportReadinessBadge } from "../shared/AuditReportReadinessBadge";
import { AuditReportStaleBadge } from "../shared/AuditReportStaleBadge";
import { AuditReportStatusBadge } from "../shared/AuditReportStatusBadge";
import type { AuditReportDetail } from "../types/audit-report.types";

export function AuditReportDetailHeader({ data, onAction, busy }: { data: AuditReportDetail; onAction: (action: string, reason?: string) => void; busy?: boolean }) {
  const report = data.report;
  const blockReason = data.readiness.blockers.map((blocker) => blocker.title).join(", ");
  return <AuditCard title="Final Report Header" subtitle="Backend status, readiness, stale state, source, approval, and export controls.">
    <div className="grid gap-3 md:grid-cols-5">
      <div><p className="text-xs text-[var(--psm-muted)]">Status</p><AuditReportStatusBadge status={report.report_status} /></div>
      <div><p className="text-xs text-[var(--psm-muted)]">Readiness</p><AuditReportReadinessBadge status={data.readiness.status} /></div>
      <div><p className="text-xs text-[var(--psm-muted)]">Staleness</p><AuditReportStaleBadge status={report.stale_status} /></div>
      <div><p className="text-xs text-[var(--psm-muted)]">Source</p><p className="font-semibold">{String(report.source_module ?? "Source")}</p></div>
      <div><p className="text-xs text-[var(--psm-muted)]">Generated</p><p className="font-semibold">{report.generated_at ? new Date(String(report.generated_at)).toLocaleString() : "Not generated"}</p></div>
    </div>
    {data.readiness.blockers.length ? <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-200">{blockReason}</div> : null}
    <nav className="mt-4 flex flex-wrap gap-2 text-sm">
      {["overview","source","snapshot","sections","evidence","findings","capa","scoring","standards","approval","files","versions","access","history"].map((tab) => <Link key={tab} href={`/audit-compliance/reports/${report.id}/${tab}`} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 font-semibold capitalize">{tab}</Link>)}
    </nav>
    <div className="mt-4 flex flex-wrap gap-2">
      <AuditButton onClick={() => onAction("generate")} disabled={busy || data.readiness.status === "Blocked"} title={data.readiness.status === "Blocked" ? `Blocked: ${blockReason}` : "Run backend generation"}>Generate</AuditButton>
      <AuditButton onClick={() => onAction("regenerate", "Regenerate from current source snapshot")} variant="secondary" disabled={busy} title="Regenerate creates a new version; official files are not overwritten.">Regenerate</AuditButton>
      <AuditButton onClick={() => onAction("submit-approval")} variant="secondary" disabled={busy || !data.readiness.readyForApproval} title={!data.readiness.readyForApproval ? `Approval disabled: ${blockReason || "approval not required"}` : "Submit to Review & Approval adapter"}>Submit Approval</AuditButton>
      <AuditButton onClick={() => onAction("lock")} variant="secondary" disabled={busy || data.readiness.status === "Blocked"} title={data.readiness.status === "Blocked" ? `Lock blocked: ${blockReason}` : "Lock official report basis"}>Lock</AuditButton>
      <AuditButton onClick={() => onAction("export")} variant="secondary" disabled={busy || !data.readiness.readyForExport} title={!data.readiness.readyForExport ? `Export disabled: ${blockReason || "generate the report first"}` : "Create export job"}>Export</AuditButton>
      <AuditButton href={`/api/v1/audit-compliance/reports/${report.id}/download`} variant="secondary" disabled={!data.files.length} title={!data.files.length ? "No generated file metadata is available." : "Download is backend logged"}>Download</AuditButton>
    </div>
  </AuditCard>;
}
