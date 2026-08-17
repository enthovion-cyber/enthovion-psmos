'use client';

import { useState } from 'react';
import { useCompetencyProfiles } from '../hooks/useCompetencyProfiles';
import { TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { CompetencyFilters } from './CompetencyFilters';
import { CompetencyHeader } from './CompetencyHeader';
import { ProfileTable } from './ProfileTable';

export function ProfileRegistryPage({ initialFilter = {} }: { initialFilter?: Record<string, any> }) {
  const [filters, setFilters] = useState(initialFilter);
  const query = useCompetencyProfiles(filters);
  if (query.isLoading) return <TrainingLoadingState rows={5} />;
  if (query.isError) return <TrainingErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  const rows = query.data?.rows ?? [];
  return <div className="space-y-5"><CompetencyHeader title="Competency Profile Registry" subtitle="Server-side profile register with saved-view filters, actions, matrix sync status, and mobile-safe layout." /><CompetencyFilters value={filters} onChange={setFilters} /><TrainingCard title={`${query.data?.total ?? 0} profiles`} subtitle="All counts and rows come from backend-scoped competency profile data."><ProfileTable rows={rows} /></TrainingCard></div>;
}
