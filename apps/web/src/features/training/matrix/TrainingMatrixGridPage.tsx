'use client';

import { useState } from 'react';
import { useTrainingMatrix, useTrainingMatrixEvaluate } from '../hooks/useTrainingMatrix';
import { TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingMatrixFilters } from './TrainingMatrixFilters';
import { TrainingMatrixGrid } from './TrainingMatrixGrid';
import { TrainingMatrixHeader } from './TrainingMatrixHeader';
import { TrainingMatrixMobileCards } from './TrainingMatrixMobileCards';

export function TrainingMatrixGridPage({ scope }: { scope?: Record<string, any> }) {
  const [filters, setFilters] = useState<Record<string, any>>({ page: 1, limit: 25, ...scope });
  const query = useTrainingMatrix(filters);
  const run = useTrainingMatrixEvaluate();
  if (query.isLoading) return <TrainingLoadingState rows={6} />;
  if (query.isError) return <TrainingErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  return <div className="space-y-5"><TrainingMatrixHeader onRun={() => run.mutate(scope)} /><TrainingMatrixFilters filters={filters} onChange={setFilters} />{run.isError ? <TrainingErrorState message={run.error.message} /> : null}<TrainingMatrixGrid rows={query.data?.rows ?? []} /><TrainingMatrixMobileCards rows={query.data?.rows ?? []} /></div>;
}
