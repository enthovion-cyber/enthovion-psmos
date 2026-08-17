'use client';

import { useState } from 'react';
import { useSopAckAssignments } from '../hooks/useSopAckAssignments';
import { TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { SopAckAssignmentTable } from './SopAckAssignmentTable';
import { SopAckFilters } from './SopAckFilters';
import { SopAckHeader } from './SopAckHeader';
import { SopAckSummaryCards } from './SopAckSummaryCards';

export function SopAckAssignmentsPage({ view, title }: { view?: string; title?: string }) {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const query = useSopAckAssignments(view ? { ...filters, view } : filters);
  if (query.isLoading) return <TrainingLoadingState rows={6} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return <div className="space-y-5"><SopAckHeader title={title ?? 'SOP Acknowledgement Assignments'} subtitle="Worker assignments with due dates, current-version gaps, e-signature, assessment, verification and PTW/MOC/PSSR blocker states." /><SopAckFilters filters={filters} onChange={setFilters} />{query.data?.summary ? <SopAckSummaryCards summary={query.data.summary} /> : null}<SopAckAssignmentTable rows={query.data?.rows ?? []} /></div>;
}
