'use client';

import { useState } from 'react';
import { useSopAckRequirements } from '../hooks/useSopAckRequirements';
import { TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { SopAckFilters } from './SopAckFilters';
import { SopAckHeader } from './SopAckHeader';
import { SopAckRequirementMobileCards } from './SopAckRequirementMobileCards';
import { SopAckRequirementTable } from './SopAckRequirementTable';

export function SopAckRequirementRegistryPage() {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const query = useSopAckRequirements(filters);
  if (query.isLoading) return <TrainingLoadingState rows={6} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return <div className="space-y-5"><SopAckHeader title="SOP Acknowledgement Requirements" subtitle="Rules linking approved SOP/document versions to worker applicability, due dates, e-signature, assessment, verification, blockers, matrix and competency evidence." /><SopAckFilters filters={filters} onChange={setFilters} /><div className="hidden lg:block"><SopAckRequirementTable rows={query.data?.rows ?? []} /></div><SopAckRequirementMobileCards rows={query.data?.rows ?? []} /></div>;
}
