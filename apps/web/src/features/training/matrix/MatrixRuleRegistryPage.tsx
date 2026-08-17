'use client';

import { useState } from 'react';
import { useMatrixRules } from '../hooks/useMatrixRules';
import { TrainingButton, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { MatrixRuleTable } from './MatrixRuleTable';
import { TrainingMatrixFilters } from './TrainingMatrixFilters';
import { TrainingMatrixHeader } from './TrainingMatrixHeader';

export function MatrixRuleRegistryPage() {
  const [filters, setFilters] = useState<Record<string, any>>({ page: 1, limit: 25 });
  const query = useMatrixRules(filters);
  if (query.isLoading) return <TrainingLoadingState rows={5} />;
  if (query.isError) return <TrainingErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  return <div className="space-y-5"><TrainingMatrixHeader title="Matrix Rule Registry" subtitle="Rule engine source of truth for who needs which training and why." /><div className="flex justify-end"><TrainingButton href="/training-competency/training-matrix/rules/new">Create Matrix Rule</TrainingButton></div><TrainingMatrixFilters filters={filters} onChange={setFilters} /><MatrixRuleTable rows={query.data?.rows ?? []} /></div>;
}
