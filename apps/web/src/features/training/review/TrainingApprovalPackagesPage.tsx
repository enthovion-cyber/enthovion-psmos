'use client';

import { useState } from 'react';
import { TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { useTrainingApprovalFiltered, useTrainingApprovalPackages } from '../hooks/useTrainingApprovalPackages';
import { TrainingReviewFilters } from './TrainingReviewFilters';
import { TrainingReviewHeader } from './TrainingReviewHeader';
import { TrainingReviewInboxTable } from './TrainingReviewInboxTable';

export function TrainingApprovalPackagesPage({ view = 'packages', title = 'Approval Packages' }: { view?: string; title?: string }) {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const packageQuery = useTrainingApprovalPackages(filters);
  const filteredQuery = useTrainingApprovalFiltered(view, filters);
  const query = view === 'packages' ? packageQuery : filteredQuery;
  if (query.isLoading) return <TrainingLoadingState rows={5} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return <div className="space-y-5"><TrainingReviewHeader title={title} subtitle="Server-side filtered approval packages with validation, SLA, stale, and e-signature states." onRefresh={() => query.refetch()} /><TrainingReviewFilters value={filters} onChange={setFilters} /><TrainingReviewInboxTable rows={query.data?.rows} title={title} /></div>;
}
