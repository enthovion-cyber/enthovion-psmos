'use client';

import { useState } from 'react';
import { useRequiredTrainingLibrary } from '../hooks/useRequiredTrainingLibrary';
import { TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { RequiredTrainingFilters } from './RequiredTrainingFilters';
import { RequiredTrainingHeader } from './RequiredTrainingHeader';
import { RequiredTrainingSummaryCards } from './RequiredTrainingSummaryCards';
import { RequiredTrainingTable } from './RequiredTrainingTable';

export function RequiredTrainingLibraryPage({ initialFilters = {} }: { initialFilters?: Record<string, string> }) {
  const [filters, setFilters] = useState(initialFilters);
  const query = useRequiredTrainingLibrary(filters);
  if (query.isLoading) return <TrainingLoadingState />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return (
    <div className="space-y-5">
      <RequiredTrainingHeader title="Required Training Library" />
      <RequiredTrainingSummaryCards summary={query.data?.summary ?? {}} />
      <RequiredTrainingFilters filters={filters} onChange={setFilters} />
      <RequiredTrainingTable rows={query.data?.rows ?? []} />
    </div>
  );
}
