"use client";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditButton, AuditCard, AuditEmptyState, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditReviewDashboard } from "../hooks/useAuditReviewDashboard";
import { AuditApprovalPackageTable } from "./AuditApprovalPackageTable";
import { AuditReviewSummaryCards } from "./AuditReviewSummaryCards";

export function AuditReviewDashboardPage() {
  const query = useAuditReviewDashboard();
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  const data = query.data;
  return <AuditLayout><div className="space-y-5">
    <AuditHeader title="Audit Review & Approval" subtitle="Backend-controlled review packages, validation, stale package checks, e-signature links, conditions, escalation, and report readiness." actionHref="/audit-compliance/review-approval/packages" actionLabel="Open Packages" />
    <AuditReviewSummaryCards summary={data.summary} />
    <div className="grid gap-5 xl:grid-cols-3">
      <AuditCard title="Pending approvals by module">{data.pendingByModule.length ? <Bars rows={data.pendingByModule} /> : <AuditEmptyState title="No pending modules" message="No approvals are waiting in this scope." />}</AuditCard>
      <AuditCard title="Reviewer workload">{data.workloadByReviewer.length ? <Bars rows={data.workloadByReviewer} /> : <AuditEmptyState title="No reviewer workload" message="No assigned reviewer workload is visible." />}</AuditCard>
      <AuditCard title="Critical attention">{data.stalePackages.length || data.validationFailures.length ? <div className="space-y-3"><p className="text-sm text-[var(--psm-muted)]">Stale or validation-failed packages block approval until refreshed or corrected.</p><AuditButton href="/audit-compliance/review-approval/validation-failures" variant="secondary">Open Validation Failures</AuditButton></div> : <AuditEmptyState title="No approval blockers" message="No stale package or validation failure is visible." />}</AuditCard>
    </div>
    <AuditCard title="My review inbox preview" action={<AuditButton href="/audit-compliance/review-approval/inbox" variant="secondary">Open Inbox</AuditButton>}>{data.inboxPreview.length ? <AuditApprovalPackageTable rows={data.inboxPreview} /> : <AuditEmptyState title="No approvals pending" message="You do not have assigned approval packages right now." />}</AuditCard>
    <AuditCard title="Records ready for reports/export" action={<AuditButton href="/audit-compliance/review-approval/completed" variant="secondary">Open Completed</AuditButton>}>{data.reportReady.length ? <AuditApprovalPackageTable rows={data.reportReady.slice(0, 8)} /> : <AuditEmptyState title="No report-ready approvals" message="Approved packages will appear here when the backend marks them report ready." />}</AuditCard>
  </div></AuditLayout>;
}

function Bars({ rows }: { rows: Array<{ key: string; label: string; count: number }> }) {
  const max = Math.max(...rows.map((row) => Number(row.count)), 1);
  return <div className="space-y-3">{rows.slice(0, 10).map((row) => <div key={row.key}><div className="mb-1 flex justify-between text-sm"><span className="truncate">{row.label}</span><b>{row.count}</b></div><div className="h-2 rounded-full bg-[var(--psm-surface-3)]"><div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(4, row.count / max * 100)}%` }} /></div></div>)}</div>;
}
