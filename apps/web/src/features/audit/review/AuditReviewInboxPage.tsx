"use client";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditCard, AuditEmptyState, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditReviewInbox } from "../hooks/useAuditReviewInbox";
import { AuditApprovalPackageTable } from "./AuditApprovalPackageTable";

export function AuditReviewInboxPage() {
  const query = useAuditReviewInbox();
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5"><AuditHeader title="Review Inbox" subtitle="Approval packages assigned to you. Backend and RLS filter this list to your scope." actionHref="/audit-compliance/review-approval/dashboard" actionLabel="Review Dashboard" /><AuditCard title="Pending my review">{query.data.rows.length ? <AuditApprovalPackageTable rows={query.data.rows} /> : <AuditEmptyState title="No approvals pending" message="No packages are assigned to you in the current company/site scope." />}</AuditCard></div></AuditLayout>;
}
