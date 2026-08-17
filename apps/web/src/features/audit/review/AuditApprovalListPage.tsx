"use client";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditCard, AuditEmptyState, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditApprovalPackages, useAuditApprovalView } from "../hooks/useAuditApprovalPackages";
import { AuditApprovalPackageTable } from "./AuditApprovalPackageTable";
import { AuditReviewSummaryCards } from "./AuditReviewSummaryCards";

export function AuditApprovalListPage({ view, title, subtitle }: { view?: string; title: string; subtitle: string }) {
  const query = view ? useAuditApprovalView(view) : useAuditApprovalPackages();
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5"><AuditHeader title={title} subtitle={subtitle} actionHref="/audit-compliance/review-approval/rules" actionLabel="Review Rules" />{query.data.summary ? <AuditReviewSummaryCards summary={query.data.summary} /> : null}<AuditCard title={title}>{query.data.rows.length ? <AuditApprovalPackageTable rows={query.data.rows} /> : <AuditEmptyState title="No approvals" message="No approval packages match this filtered view." />}</AuditCard></div></AuditLayout>;
}
