'use client';

import { useQuery } from '@tanstack/react-query';
import { trainingMatrixService } from '../services/training-matrix.service';
import { TrainingCard, TrainingErrorState, TrainingLoadingState, TrainingProgress } from '../shared/TrainingUi';
import { TrainingMatrixHeader } from './TrainingMatrixHeader';

export function RoleMatrixViewPage() {
  const query = useQuery({ queryKey: ['matrix-role-view'], queryFn: () => trainingMatrixService.roleView() });
  if (query.isLoading) return <TrainingLoadingState rows={4} />;
  if (query.isError) return <TrainingErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  return <GroupedView title="Role Matrix View" rows={Array.isArray(query.data) ? query.data : query.data?.rows ?? []} />;
}

export function UnitMatrixViewPage({ scope }: { scope?: Record<string, any> }) {
  const query = useQuery({ queryKey: ['matrix-unit-view', scope], queryFn: () => scope?.unitId ? trainingMatrixService.scopedMatrix('units', scope.unitId, scope) : trainingMatrixService.unitView(scope) });
  if (query.isLoading) return <TrainingLoadingState rows={4} />;
  if (query.isError) return <TrainingErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  return <GroupedView title="Unit Matrix View" rows={Array.isArray(query.data) ? query.data : query.data?.rows ?? query.data ?? []} />;
}

function GroupedView({ title, rows }: { title: string; rows: Record<string, any>[] }) {
  return <div className="space-y-5"><TrainingMatrixHeader title={title} subtitle="Server-side aggregation matching worker matrix evaluations." /><div className="grid gap-4 lg:grid-cols-2">{rows.map((row) => <TrainingCard key={row.label} title={row.label}><TrainingProgress value={row.completionPercent ?? 0} /><div className="mt-3 grid grid-cols-2 gap-2 text-sm"><span>Workers: <b>{row.workers ?? 0}</b></span><span>Required: <b>{row.requiredTraining ?? 0}</b></span><span>Incomplete: <b>{row.incompleteRequirements ?? 0}</b></span><span>Safety gaps: <b>{row.safetyCriticalGaps ?? 0}</b></span><span>PTW gaps: <b>{row.ptwGaps ?? 0}</b></span><span>PSSR blockers: <b>{row.pssrBlockers ?? 0}</b></span></div></TrainingCard>)}</div></div>;
}
