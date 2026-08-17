'use client';

import { useEvaluateWorkerMatrix, useWorkerMatrix } from '../hooks/useWorkerMatrix';
import { TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingEvidenceDrilldown } from './TrainingEvidenceDrilldown';
import { WorkerMatrixHeader } from './WorkerMatrixHeader';
import { WorkerMatrixRequirementTable } from './WorkerMatrixRequirementTable';
import { WorkerMatrixSummaryCards } from './WorkerMatrixSummaryCards';
import { TrainingMatrixGapTable } from './gaps/TrainingMatrixGapTable';

export function WorkerMatrixPage({ workerId }: { workerId: string }) {
  const query = useWorkerMatrix(workerId);
  const run = useEvaluateWorkerMatrix(workerId);
  if (query.isLoading) return <TrainingLoadingState rows={6} />;
  if (query.isError) return <TrainingErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  const data = query.data ?? {};
  return <div className="space-y-5"><WorkerMatrixHeader worker={data.worker} summary={data.summary} onEvaluate={() => run.mutate()} />{run.isError ? <TrainingErrorState message={run.error.message} /> : null}<WorkerMatrixSummaryCards summary={data.summary ?? {}} /><WorkerMatrixRequirementTable rows={data.requirements ?? []} /><div className="grid gap-4 xl:grid-cols-2"><TrainingCard title="Worker Gaps"><TrainingMatrixGapTable rows={data.gaps ?? []} compact /></TrainingCard><TrainingEvidenceDrilldown /></div></div>;
}
