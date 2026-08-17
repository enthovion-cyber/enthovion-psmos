'use client';

import { useTrainingCompletionRecord } from '../../hooks/useTrainingCompletionRecords';
import { TrainingCard, TrainingEmptyState, TrainingErrorState, TrainingLoadingState } from '../../shared/TrainingUi';
import { TrainingRecordsHeader } from '../TrainingRecordsHeader';
import { CompletionEvidencePanel } from './CompletionEvidencePanel';
import { CompletionLinkedMatrixCompetencyPanel } from './CompletionLinkedMatrixCompetencyPanel';
import { CompletionVerificationPanel } from './CompletionVerificationPanel';

export function TrainingCompletionRecordDetailPage({ recordId }: { recordId: string }) {
  const query = useTrainingCompletionRecord(recordId);
  if (query.isLoading) return <TrainingLoadingState />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  if (!query.data?.record) return <TrainingEmptyState title="Record not found" message="No completion record was returned for this ID and scope." />;
  const record = query.data.record;
  return (
    <div className="space-y-5">
      <TrainingRecordsHeader title={record.training_title ?? record.record_number ?? 'Training Completion Record'} primaryHref={`/training-competency/training-records/records/${record.id}/edit`} />
      <TrainingCard title="Completion Record Detail">
        <dl className="grid gap-3 text-sm md:grid-cols-3">
          {Object.entries({ Worker: record.workerName ?? record.worker_id, Training: record.training_title ?? record.training_item_id, Version: record.training_item_version, Completion: record.completion_status, Attendance: record.attendance_status, Score: record.score, Result: record.assessment_result, Completed: record.completion_date, Expires: record.expiry_date }).map(([key, value]) => <div key={key} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><dt className="text-xs uppercase text-[var(--psm-muted)]">{key}</dt><dd className="mt-1 font-semibold">{String(value ?? '-')}</dd></div>)}
        </dl>
      </TrainingCard>
      <div className="grid gap-4 xl:grid-cols-2">
        <CompletionVerificationPanel record={record} />
        <CompletionLinkedMatrixCompetencyPanel record={record} links={query.data.links} />
      </div>
      <CompletionEvidencePanel evidence={query.data.evidence} />
      <TrainingCard title="Change History">{(query.data.history ?? []).length ? <div className="space-y-2">{query.data.history?.map((row) => <div key={row.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm"><b>{row.event_title ?? row.event_type}</b><p className="text-[var(--psm-muted)]">{row.event_description ?? row.created_at}</p></div>)}</div> : <p className="text-sm text-[var(--psm-muted)]">No history events returned for this completion record.</p>}</TrainingCard>
    </div>
  );
}
