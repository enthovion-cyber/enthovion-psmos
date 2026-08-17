'use client';

import { useState } from 'react';
import { usePssrTrainingReadiness } from '../hooks/usePssrTrainingRequirements';
import { TrainingButton, TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingPssrFilters } from './TrainingPssrFilters';
import { TrainingPssrHeader } from './TrainingPssrHeader';
import { TrainingPssrReadinessMobileCards } from './TrainingPssrReadinessMobileCards';
import { TrainingPssrReadinessTable } from './TrainingPssrReadinessTable';
import { TrainingPssrSummaryCards } from './TrainingPssrSummaryCards';

export function TrainingPssrReadinessRegisterPage({ initialFilters = {}, title }: { initialFilters?: Record<string, any>; title?: string }) {
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters);
  const query = usePssrTrainingReadiness(filters);
  if (query.isLoading) return <TrainingLoadingState rows={5} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return <div className="space-y-6"><TrainingPssrHeader title={title ?? 'PSSR Training Readiness Register'} /><TrainingPssrFilters filters={filters} onChange={setFilters} /><TrainingPssrSummaryCards summary={query.data?.summary ?? {}} /><TrainingCard title="Readiness Register" subtitle={`${query.data?.total ?? 0} records`} action={<TrainingButton href="/training-competency/pssr-training-readiness/new">New Readiness</TrainingButton>}><div className="hidden lg:block"><TrainingPssrReadinessTable rows={query.data?.rows ?? []} /></div><TrainingPssrReadinessMobileCards rows={query.data?.rows ?? []} /></TrainingCard></div>;
}

