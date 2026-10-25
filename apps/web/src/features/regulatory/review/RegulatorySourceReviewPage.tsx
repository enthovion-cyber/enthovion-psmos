'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { regulatoryReviewService } from '../services/regulatory-review.service';
import { RegulatoryButton, RegulatoryCard, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';

export function RegulatorySourceReviewPage({ sourcePath, submitPath, title = 'Source Review' }: { sourcePath: string; submitPath: string; title?: string | undefined }) {
  const router = useRouter();
  const query = useQuery({ queryKey: ['regulatory', 'source-review', sourcePath], queryFn: () => regulatoryReviewService.sourceReview(sourcePath), refetchOnWindowFocus: false });
  const submit = useMutation({ mutationFn: () => regulatoryReviewService.submitSourceReview(submitPath, { submitNow: true, reason: 'Submitted from source review tab.' }), onSuccess: (data) => router.push(`/regulatory/review-approval/packages/${data.package.id}`) });
  if (query.isLoading) return <RegulatoryLoadingState />;
  if (query.isError) return <RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} />;
  const data = query.data ?? {};
  const disabledReason = data.submitAllowed ? undefined : String(data.disabledReason ?? 'You do not have permission to submit this source for review.');
  return (
    <div className="space-y-6">
      <RegulatoryHeader title={title} subtitle="Backend validates source scope, readiness, stale state and creates an immutable review package snapshot." action={<RegulatoryButton disabled={!data.submitAllowed || submit.isPending} title={disabledReason} onClick={() => submit.mutate()}>{submit.isPending ? 'Submitting...' : 'Submit For Review'}</RegulatoryButton>} />
      {submit.isError ? <RegulatoryErrorState message={submit.error} /> : null}
      <RegulatoryCard title="Validation Readiness"><pre className="overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs text-[var(--psm-fg)]">{JSON.stringify(data.validation ?? {}, null, 2)}</pre></RegulatoryCard>
      <RegulatoryCard title="Existing Review Packages"><pre className="overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs text-[var(--psm-fg)]">{JSON.stringify(data.packages ?? [], null, 2)}</pre></RegulatoryCard>
      <RegulatoryCard title="Source Snapshot"><pre className="overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs text-[var(--psm-fg)]">{JSON.stringify(data.source ?? {}, null, 2)}</pre></RegulatoryCard>
    </div>
  );
}
