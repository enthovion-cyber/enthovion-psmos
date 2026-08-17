'use client';

import { useSearchParams } from 'next/navigation';
import { useTrainingSessions } from '../../hooks/useTrainingSessions';
import { TrainingEmptyState, TrainingErrorState, TrainingLoadingState } from '../../shared/TrainingUi';
import { TrainingRecordsFilters } from '../TrainingRecordsFilters';
import { TrainingRecordsHeader } from '../TrainingRecordsHeader';
import { TrainingSessionMobileCards } from './TrainingSessionMobileCards';
import { TrainingSessionTable } from './TrainingSessionTable';

export function TrainingSessionRegistryPage({ title = 'Training Session Registry', params = {} }: { title?: string; params?: Record<string, unknown> }) {
  const searchParams = Object.fromEntries(useSearchParams().entries());
  const query = useTrainingSessions({ ...searchParams, ...params });
  if (query.isLoading) return <TrainingLoadingState />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  if (!query.data) return <TrainingEmptyState title="No session registry data" message="The backend did not return a session registry." />;
  return <div className="space-y-5"><TrainingRecordsHeader title={title} /><TrainingRecordsFilters /><TrainingSessionMobileCards rows={query.data.rows} /><div className="hidden md:block"><TrainingSessionTable rows={query.data.rows} /></div></div>;
}
