"use client";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditCard, AuditEmptyState, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { AuditReportJobStatusBadge } from "../shared/AuditReportJobStatusBadge";
import { useAuditReportJobs } from "../hooks/useAuditReportJobs";
export function AuditReportJobPage() {
  const query = useAuditReportJobs();
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5"><AuditHeader title="Report Generation Jobs" subtitle="Generation, regeneration, package, and export jobs with backend status and errors." actionHref="/audit-compliance/reports/generate" actionLabel="Generate" /><AuditCard title="Jobs">{query.data.rows.length ? <div className="space-y-2">{query.data.rows.map((row) => <a key={String(row.id)} href={`/audit-compliance/reports/jobs/${row.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><span>{String(row.job_type ?? "Job")} / {String(row.requested_format ?? "")}</span><AuditReportJobStatusBadge status={String(row.job_status ?? "Queued")} /></a>)}</div> : <AuditEmptyState title="No jobs" message="No report generation/export jobs are visible." />}</AuditCard></div></AuditLayout>;
}
