'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { requiredTrainingService } from '../services/required-training.service';
import { TrainingButton, TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { RequiredTrainingHeader } from './RequiredTrainingHeader';

export function RequiredTrainingImportPage() {
  const template = useQuery({ queryKey: ['required-training', 'import-template'], queryFn: requiredTrainingService.importTemplate });
  const job = useMutation({ mutationFn: () => requiredTrainingService.importJob({ sourceFileName: 'manual-template.csv', totalRows: 0 }) });
  if (template.isLoading) return <TrainingLoadingState />;
  if (template.isError) return <TrainingErrorState message={template.error} />;
  return <div className="space-y-5"><RequiredTrainingHeader title="Import Required Training" /><TrainingCard title="Import template" subtitle="The backend controls import jobs and routes imported records through review policy."><div className="flex flex-wrap gap-2">{(template.data?.columns ?? []).map((column: string) => <code key={column} className="rounded bg-[var(--psm-surface-2)] px-2 py-1 text-xs">{column}</code>)}</div><div className="mt-4"><TrainingButton onClick={() => job.mutate()} disabled={job.isPending} title={job.isPending ? 'Import job is already being queued.' : ''}>{job.isPending ? 'Queueing...' : 'Queue Import Job'}</TrainingButton></div>{job.data ? <p className="mt-3 text-sm text-success">Import job queued: {job.data.id}</p> : null}{job.error ? <TrainingErrorState message={job.error} /> : null}</TrainingCard></div>;
}
