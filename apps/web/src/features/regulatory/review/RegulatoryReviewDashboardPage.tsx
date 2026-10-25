'use client';

import { RegulatoryHeader } from '../RegulatoryHeader';
import { useRegulatoryReviewDashboard } from '../hooks/useRegulatoryReviewDashboard';
import { RegulatoryButton, RegulatoryCard, RegulatoryEmptyState, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { RegulatoryReviewSummaryCards } from './RegulatoryReviewSummaryCards';
import { RegulatoryReviewPackageTable } from './RegulatoryReviewPackageTable';

export function RegulatoryReviewDashboardPage() {
  const query = useRegulatoryReviewDashboard();
  if (query.isLoading) return <RegulatoryLoadingState />;
  if (query.isError) return <RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} />;
  const data = query.data;
  return (
    <div className="space-y-6">
      <RegulatoryHeader
        title={data?.header?.title ?? 'Regulatory Review & Approval'}
        subtitle={data?.header?.subtitle ?? 'Formal review packages, validation, snapshots, e-signature and conditions foundation.'}
        action={<RegulatoryButton href="/regulatory/review-approval/packages/new">Submit Regulatory Record For Review</RegulatoryButton>}
      />
      <RegulatoryReviewSummaryCards summary={data?.summary} />
      <div className="grid gap-4 xl:grid-cols-2">
        <RegulatoryCard title="My Review Inbox" subtitle="Packages assigned to the current user."><RegulatoryReviewPackageTable rows={data?.inboxPreview ?? []} /></RegulatoryCard>
        <RegulatoryCard title="Stale / Validation Attention" subtitle="Packages blocked by stale source data or validation."><RegulatoryReviewPackageTable rows={[...(data?.stalePreview ?? []), ...(data?.validationFailures ?? [])]} /></RegulatoryCard>
      </div>
      <RegulatoryCard title="Recent Review Packages" subtitle="Latest regulatory review package activity.">
        {(data?.recent ?? []).length ? <RegulatoryReviewPackageTable rows={data?.recent} /> : <RegulatoryEmptyState title="No reviews yet" message="Create a review package when a regulatory item, obligation, compliance decision, evidence verification, audit mapping, or CAPA closure needs formal approval." action={<RegulatoryButton href="/regulatory/review-approval/packages/new">Submit Regulatory Record For Review</RegulatoryButton>} />}
      </RegulatoryCard>
    </div>
  );
}
