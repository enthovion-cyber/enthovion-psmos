'use client';

import { useState } from 'react';
import { useMocTrainingRequirements } from '../hooks/useMocTrainingRequirements';
import { TrainingButton, TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingMocFilters } from './TrainingMocFilters';
import { TrainingMocHeader } from './TrainingMocHeader';
import { TrainingMocRequirementMobileCards } from './TrainingMocRequirementMobileCards';
import { TrainingMocRequirementTable } from './TrainingMocRequirementTable';
import { TrainingMocSummaryCards } from './TrainingMocSummaryCards';

export function TrainingMocRequirementRegisterPage({ initialFilters = {}, title }: { initialFilters?: Record<string, any>; title?: string }) {
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters);
  const query = useMocTrainingRequirements(filters);
  if (query.isLoading) return <TrainingLoadingState rows={5} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return <div className="space-y-6"><TrainingMocHeader title={title ?? 'MOC Training Requirement Register'} /><TrainingMocFilters filters={filters} onChange={setFilters} /><TrainingMocSummaryCards summary={query.data?.summary ?? {}} /><TrainingCard title="Requirement Register" subtitle={`${query.data?.total ?? 0} records`} action={<TrainingButton href="/training-competency/moc-training-requirements/new">New Requirement</TrainingButton>}><div className="hidden lg:block"><TrainingMocRequirementTable rows={query.data?.rows ?? []} /></div><TrainingMocRequirementMobileCards rows={query.data?.rows ?? []} /></TrainingCard></div>;
}
