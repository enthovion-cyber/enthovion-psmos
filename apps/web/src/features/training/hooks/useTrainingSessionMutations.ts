import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingRecordsService } from '../services/training-records.service';

export function useTrainingSessionMutations(sessionId?: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['training-records'] });
    if (sessionId) void qc.invalidateQueries({ queryKey: ['training-records', 'session', sessionId] });
  };
  return {
    createSession: useMutation({ mutationFn: (data: Record<string, unknown>) => trainingRecordsService.createSession(data), onSuccess: invalidate }),
    updateSession: useMutation({ mutationFn: (data: Record<string, unknown>) => trainingRecordsService.updateSession(sessionId ?? String(data.sessionId), data), onSuccess: invalidate }),
    completeSession: useMutation({ mutationFn: () => trainingRecordsService.completeSession(sessionId ?? ''), onSuccess: invalidate }),
    addRoster: useMutation({ mutationFn: (data: Record<string, unknown>) => trainingRecordsService.addRoster(sessionId ?? '', data), onSuccess: invalidate }),
    rosterFromMatrixGaps: useMutation({ mutationFn: () => trainingRecordsService.rosterFromMatrixGaps(sessionId ?? ''), onSuccess: invalidate }),
    markAllPresent: useMutation({ mutationFn: () => trainingRecordsService.markAllPresent(sessionId ?? ''), onSuccess: invalidate }),
    submitAttendance: useMutation({ mutationFn: () => trainingRecordsService.submitAttendance(sessionId ?? ''), onSuccess: invalidate }),
    lockAttendance: useMutation({ mutationFn: () => trainingRecordsService.lockAttendance(sessionId ?? ''), onSuccess: invalidate })
  };
}
