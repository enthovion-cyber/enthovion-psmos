'use client';

import { TrainingButton, TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { useTrainingApprovalPackages, useTrainingApprovalMutations } from '../hooks/useTrainingApprovalPackages';
import { TrainingReviewHeader } from './TrainingReviewHeader';
import { TrainingReviewInboxTable } from './TrainingReviewInboxTable';

export function TrainingSourceReviewPage({ sourceModule, sourceRecordType, sourceRecordId }: { sourceModule: string; sourceRecordType: string; sourceRecordId: string }) {
  const query = useTrainingApprovalPackages({ sourceModule, sourceRecordType, search: sourceRecordId });
  const mutations = useTrainingApprovalMutations();
  if (query.isLoading) return <TrainingLoadingState rows={5} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return (
    <div className="space-y-5">
      <TrainingReviewHeader title={`${sourceModule} Review`} subtitle={`${sourceRecordType} / ${sourceRecordId}`} onRefresh={() => query.refetch()} />
      <TrainingCard title="Submit Source Record For Review" subtitle="Creates a Training approval package with immutable source snapshot, validation route, stage, due date, and audit/history.">
        <TrainingButton disabled={mutations.create.isPending} onClick={() => mutations.create.mutate({ sourceModule, sourceRecordType, sourceRecordId, approvalTitle: `${sourceModule} ${sourceRecordType} review`, sourceRecordTitle: sourceRecordId, sourceSnapshot: { sourceModule, sourceRecordType, sourceRecordId, capturedFrom: 'Source review route' } })}>{mutations.create.isPending ? 'Submitting...' : 'Submit Review Package'}</TrainingButton>
      </TrainingCard>
      <TrainingReviewInboxTable rows={query.data?.rows} title="Related approval packages" />
    </div>
  );
}
