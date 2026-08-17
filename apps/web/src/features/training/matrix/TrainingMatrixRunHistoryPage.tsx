'use client';

import { useMatrixRunHistory } from '../hooks/useMatrixEvaluations';
import { TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingMatrixHeader } from './TrainingMatrixHeader';
import { TrainingMatrixRunHistoryTable } from './TrainingMatrixRunHistoryTable';

export function TrainingMatrixRunHistoryPage() {
  const query = useMatrixRunHistory();
  if (query.isLoading) return <TrainingLoadingState rows={4} />;
  if (query.isError) return <TrainingErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  return <div className="space-y-5"><TrainingMatrixHeader title="Matrix Run History" /><TrainingMatrixRunHistoryTable rows={query.data?.rows ?? []} /></div>;
}
