'use client';

import { useState } from 'react';
import { useWorkforce } from '../hooks/useWorkforce';
import { TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { WorkforceFilters } from './WorkforceFilters';
import { WorkforceHeader } from './WorkforceHeader';
import { WorkforceMobileCards } from './WorkforceMobileCards';
import { WorkforceSummaryCards } from './WorkforceSummaryCards';
import { WorkforceTable } from './WorkforceTable';

export function WorkforceRegistryPage() {
  const [filters, setFilters] = useState<Record<string, any>>({ page: 1, limit: 25, sort: 'updated_at.desc' });
  const query = useWorkforce(filters);
  if (query.isLoading) return <TrainingLoadingState rows={6} />;
  if (query.isError) return <TrainingErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  return (
    <div className="space-y-5">
      <WorkforceHeader total={query.data?.total ?? 0} />
      <WorkforceSummaryCards summary={query.data?.summary ?? {}} />
      <WorkforceFilters filters={filters} onChange={setFilters} />
      <WorkforceTable rows={query.data?.rows ?? []} />
      <WorkforceMobileCards rows={query.data?.rows ?? []} />
    </div>
  );
}
