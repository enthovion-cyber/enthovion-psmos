'use client';

import { useState } from 'react';
import { TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { trainingReviewService } from '../services/training-review.service';
import { useQuery } from '@tanstack/react-query';
import { TrainingReviewFilters } from './TrainingReviewFilters';
import { TrainingReviewHeader } from './TrainingReviewHeader';
import { TrainingReviewInboxTable } from './TrainingReviewInboxTable';

export function MyTrainingSubmissionsPage() {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const query = useQuery({ queryKey: ['training', 'review', 'my-submissions', filters], queryFn: () => trainingReviewService.submissions(filters) });
  if (query.isLoading) return <TrainingLoadingState rows={5} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return <div className="space-y-5"><TrainingReviewHeader title="My Submissions" subtitle="Training approvals submitted by you within your current company/site scope." onRefresh={() => query.refetch()} /><TrainingReviewFilters value={filters} onChange={setFilters} /><TrainingReviewInboxTable rows={query.data?.rows} title="My submitted approval packages" /></div>;
}
