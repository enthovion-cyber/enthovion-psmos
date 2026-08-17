'use client';

import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { TrainingCard, TrainingEmptyState, TrainingErrorState, TrainingLoadingState } from '../../shared/TrainingUi';
import { trainingRecordsService } from '../../services/training-records.service';
import { TrainingRecordsFilters } from '../TrainingRecordsFilters';
import { TrainingRecordsHeader } from '../TrainingRecordsHeader';
import { CompletionRecordTable } from './CompletionRecordTable';

export function TrainingCompletionRecordsPage({ mode = 'records', params = {} }: { mode?: string; params?: Record<string, unknown> }) {
  const search = useSearchParams();
  const queryParams = { ...Object.fromEntries(search.entries()), ...params };
  const query = useQuery({ queryKey: ['training-records', mode, queryParams], queryFn: () => recordsForMode(mode, queryParams) });
  if (query.isLoading) return <TrainingLoadingState />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  if (!query.data) return <TrainingEmptyState title="No completion register" message="The backend did not return completion records for this scope." />;
  return (
    <div className="space-y-5">
      <TrainingRecordsHeader title={titleForMode(mode)} primaryHref="/training-competency/training-records/records/new" />
      <TrainingRecordsFilters />
      <TrainingCard title="Completion records register" subtitle="Backend source of truth for training completion, verification, approval, evidence, expiry, matrix and competency resolution.">
        <CompletionRecordTable rows={query.data.rows ?? []} />
      </TrainingCard>
    </div>
  );
}

function recordsForMode(mode: string, params: Record<string, unknown>) {
  if (mode === 'attendance') return trainingRecordsService.attendanceView(params);
  if (mode === 'completions') return trainingRecordsService.completions(params);
  if (mode === 'pending-verification') return trainingRecordsService.pendingVerification(params);
  if (mode === 'pending-approval') return trainingRecordsService.pendingApproval(params);
  if (mode === 'failed-incomplete') return trainingRecordsService.failedIncomplete(params);
  return trainingRecordsService.records(params);
}

function titleForMode(mode: string) {
  if (mode === 'pending-verification') return 'Pending Verification';
  if (mode === 'pending-approval') return 'Pending Approval';
  if (mode === 'failed-incomplete') return 'Failed / Incomplete Records';
  if (mode === 'attendance') return 'Attendance Records';
  return 'Training Completion Records';
}
