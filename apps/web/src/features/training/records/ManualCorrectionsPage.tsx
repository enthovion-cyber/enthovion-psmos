'use client';

import { useQuery } from '@tanstack/react-query';
import { trainingRecordsService } from '../services/training-records.service';
import { TrainingCard, TrainingEmptyState, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingRecordsHeader } from './TrainingRecordsHeader';

export function ManualCorrectionsPage() {
  const query = useQuery({ queryKey: ['training-records', 'manual-corrections'], queryFn: () => trainingRecordsService.manualCorrections() });
  if (query.isLoading) return <TrainingLoadingState />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return <div className="space-y-5"><TrainingRecordsHeader title="Manual Corrections" /><TrainingCard title="Controlled Corrections Register" subtitle="Corrections preserve before/after values, reason, actor, audit reference and training history events.">{!(query.data ?? []).length ? <TrainingEmptyState title="No manual corrections" message="No controlled correction records were returned for this scope." /> : <div className="space-y-2">{query.data?.map((row) => <div key={row.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm"><p className="font-semibold">{row.update_type ?? row.event_type ?? 'Correction'}</p><p className="text-[var(--psm-muted)]">{row.reason ?? row.event_description ?? row.created_at}</p></div>)}</div>}</TrainingCard></div>;
}
