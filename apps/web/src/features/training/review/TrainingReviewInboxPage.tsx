'use client';

import { useState } from 'react';
import { TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { useTrainingReviewInbox } from '../hooks/useTrainingReviewInbox';
import { TrainingReviewFilters } from './TrainingReviewFilters';
import { TrainingReviewHeader } from './TrainingReviewHeader';
import { TrainingReviewInboxTable } from './TrainingReviewInboxTable';

export function TrainingReviewInboxPage() {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const query = useTrainingReviewInbox(filters);
  if (query.isLoading) return <TrainingLoadingState rows={5} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return <div className="space-y-5"><TrainingReviewHeader title="Approval Inbox" subtitle="Packages assigned to you, delegated reviewer roles, or allowed approval roles." onRefresh={() => query.refetch()} /><TrainingReviewFilters value={filters} onChange={setFilters} /><TrainingReviewInboxTable rows={query.data?.rows} title="Assigned approval tasks" /></div>;
}
