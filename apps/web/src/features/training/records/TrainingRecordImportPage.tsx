'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { trainingRecordsService } from '../services/training-records.service';
import { TrainingButton, TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingRecordsHeader } from './TrainingRecordsHeader';

export function TrainingRecordImportPage() {
  const template = useQuery({ queryKey: ['training-records', 'import-template'], queryFn: trainingRecordsService.importTemplate });
  const job = useMutation({ mutationFn: () => trainingRecordsService.importJob({ sourceModule: 'Manual Upload', validateOnly: true }) });
  if (template.isLoading) return <TrainingLoadingState />;
  if (template.isError) return <TrainingErrorState message={template.error} onRetry={() => template.refetch()} />;
  return <div className="space-y-5"><TrainingRecordsHeader title="Import Training Records" /><TrainingCard title="Bulk Import / Validation" subtitle="Imports validate before commit, preserve evidence metadata, and create audit/history records when committed."><div className="flex flex-wrap gap-2">{(template.data?.columns ?? []).map((column: string) => <code key={column} className="rounded bg-[var(--psm-surface-2)] px-2 py-1 text-xs">{column}</code>)}</div><div className="mt-4"><TrainingButton onClick={() => job.mutate()} disabled={job.isPending} title={job.isPending ? 'Import validation job is already running.' : 'Queue backend validation job.'}>{job.isPending ? 'Validating...' : 'Validate Import'}</TrainingButton></div>{job.data ? <p className="mt-3 text-sm text-success">Import job queued: {job.data.id ?? job.data.status}</p> : null}{job.error ? <div className="mt-3"><TrainingErrorState message={job.error} /></div> : null}</TrainingCard></div>;
}
