'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingRecordsService } from '../../services/training-records.service';
import { useTrainingAttendance } from '../../hooks/useTrainingAttendance';
import { useTrainingSessionDetail } from '../../hooks/useTrainingSessionDetail';
import { useTrainingSessionMutations } from '../../hooks/useTrainingSessionMutations';
import { TrainingCard, TrainingErrorState, TrainingLoadingState } from '../../shared/TrainingUi';
import { TrainingSessionDetailHeader } from '../sessions/TrainingSessionDetailHeader';
import { AttendanceBulkActions } from './AttendanceBulkActions';
import { AttendanceCorrectionDialog } from './AttendanceCorrectionDialog';
import { AttendanceRosterTable } from './AttendanceRosterTable';

export function AttendanceEntryPage({ sessionId }: { sessionId: string }) {
  const qc = useQueryClient();
  const detail = useTrainingSessionDetail(sessionId);
  const attendance = useTrainingAttendance(sessionId);
  const actions = useTrainingSessionMutations(sessionId);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [reason, setReason] = useState('');
  useEffect(() => setRows(attendance.data ?? []), [attendance.data]);
  const save = useMutation({
    mutationFn: (row: Record<string, any>) => row.id ? trainingRecordsService.updateAttendance(sessionId, row.id, { ...row, reason }) : trainingRecordsService.saveAttendance(sessionId, row),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['training-records', 'attendance', sessionId] })
  });
  if (detail.isLoading || attendance.isLoading) return <TrainingLoadingState />;
  if (detail.isError) return <TrainingErrorState message={detail.error} onRetry={() => detail.refetch()} />;
  if (attendance.isError) return <TrainingErrorState message={attendance.error} onRetry={() => attendance.refetch()} />;
  const busy = save.isPending || actions.markAllPresent.isPending || actions.submitAttendance.isPending || actions.lockAttendance.isPending;
  return (
    <div className="space-y-5">
      {detail.data?.session ? <TrainingSessionDetailHeader session={detail.data.session} /> : null}
      <TrainingCard title="Attendance Entry" subtitle="Bulk entry, individual statuses, submission, lock and controlled corrections are persisted through backend APIs." action={<AttendanceBulkActions busy={busy} onMarkAllPresent={() => actions.markAllPresent.mutate()} onSubmit={() => actions.submitAttendance.mutate()} onLock={() => actions.lockAttendance.mutate()} />}>
        <AttendanceRosterTable rows={rows} busy={busy} onStatus={(id, status) => setRows((prev) => prev.map((row) => row.id === id ? { ...row, attendance_status: status } : row))} onSave={(row) => save.mutate(row)} />
      </TrainingCard>
      <AttendanceCorrectionDialog reason={reason} onReasonChange={setReason} />
      {save.error ? <TrainingErrorState message={save.error} /> : null}
    </div>
  );
}
