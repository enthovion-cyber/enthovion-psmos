'use client';

import { useQuery } from '@tanstack/react-query';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { regulatoryReviewService } from '../services/regulatory-review.service';
import { RegulatoryCard, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';

export function RegulatoryReviewRulePage() {
  const query = useQuery({ queryKey: ['regulatory', 'review-approval', 'rules'], queryFn: () => regulatoryReviewService.rules(), refetchOnWindowFocus: false });
  if (query.isLoading) return <RegulatoryLoadingState />;
  if (query.isError) return <RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} />;
  return (
    <div className="space-y-6">
      <RegulatoryHeader title="Review Rule Builder Foundation" subtitle="Reviewer assignment, e-signature, separation-of-duties, SLA and escalation rule records are persisted in the backend." />
      <RegulatoryCard title="Rules">
        <pre className="overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs text-[var(--psm-fg)]">{JSON.stringify(query.data?.rows ?? [], null, 2)}</pre>
      </RegulatoryCard>
    </div>
  );
}
