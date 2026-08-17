"use client";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditButton, AuditCard, AuditEmptyState, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditReportsDashboard } from "../hooks/useAuditReportsDashboard";
import { AuditReportTable } from "./AuditReportTable";
import { AuditReportsSummaryCards } from "./AuditReportsSummaryCards";

export function AuditReportsDashboardPage() {
  const query = useAuditReportsDashboard();
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  const data = query.data;
  return <AuditLayout><div className="space-y-5">
    <AuditHeader title="Audit Reports / Export" subtitle="Generate controlled audit reports, evidence packages, exports, templates, access logs, staleness checks, and approval-linked official report records." actionHref="/audit-compliance/reports/generate" actionLabel="Generate Report" />
    <AuditReportsSummaryCards summary={data.summary} />
    <div className="grid gap-5 xl:grid-cols-3">
      <AuditCard title="Reports by type">{data.byType.length ? <Bars rows={data.byType} /> : <AuditEmptyState title="No report types" message="No report records are visible in this scope." />}</AuditCard>
      <AuditCard title="Reports by site">{data.bySite.length ? <Bars rows={data.bySite} /> : <AuditEmptyState title="No site data" message="Site scoped reports will appear here." />}</AuditCard>
      <AuditCard title="Critical attention" action={<AuditButton href="/audit-compliance/reports/stale" variant="secondary">Open Stale</AuditButton>}>{data.staleReports.length || data.failedJobs.length ? <div className="space-y-2 text-sm"><p>{data.staleReports.length} stale report(s)</p><p>{data.failedJobs.length} failed generation/export job(s)</p></div> : <AuditEmptyState title="No report blockers" message="No stale reports or failed jobs are visible." />}</AuditCard>
    </div>
    <AuditCard title="Recent generated reports" action={<AuditButton href="/audit-compliance/reports/register" variant="secondary">Open Register</AuditButton>}>{data.recentReports.length ? <AuditReportTable rows={data.recentReports} /> : <AuditEmptyState title="No reports yet" message="Generate a report from an approved audit source record to create the first register row." />}</AuditCard>
  </div></AuditLayout>;
}

function Bars({ rows }: { rows: Array<{ key: string; label: string; count: number }> }) {
  const max = Math.max(...rows.map((row) => row.count), 1);
  return <div className="space-y-3">{rows.slice(0, 10).map((row) => <div key={row.key}><div className="mb-1 flex justify-between text-sm"><span>{row.label}</span><b>{row.count}</b></div><div className="h-2 rounded-full bg-[var(--psm-surface-3)]"><div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(4, row.count / max * 100)}%` }} /></div></div>)}</div>;
}
