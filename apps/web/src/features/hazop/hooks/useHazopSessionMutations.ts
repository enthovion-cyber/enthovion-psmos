'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hazopSessionService } from '../services/hazop-session.service';

export function useHazopSessionMutations(studyId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['hazop'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'sessions'] });
  };
  return {
    create: useMutation({ mutationFn: (values: Record<string, any>) => hazopSessionService.create(studyId, values), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ sessionId, values }: { sessionId: string; values: Record<string, any> }) => hazopSessionService.update(studyId, sessionId, values), onSuccess: invalidate }),
    start: useMutation({ mutationFn: (sessionId: string) => hazopSessionService.start(studyId, sessionId), onSuccess: invalidate }),
    complete: useMutation({ mutationFn: (sessionId: string) => hazopSessionService.complete(studyId, sessionId), onSuccess: invalidate }),
    reschedule: useMutation({ mutationFn: ({ sessionId, values }: { sessionId: string; values: Record<string, any> }) => hazopSessionService.reschedule(studyId, sessionId, values), onSuccess: invalidate }),
    cancel: useMutation({ mutationFn: ({ sessionId, reason }: { sessionId: string; reason?: string }) => hazopSessionService.cancel(studyId, sessionId, reason), onSuccess: invalidate }),
    markAttendance: useMutation({ mutationFn: ({ sessionId, values }: { sessionId: string; values: Record<string, any> }) => hazopSessionService.markAttendance(studyId, sessionId, values), onSuccess: invalidate }),
    saveMinutes: useMutation({ mutationFn: ({ sessionId, minutesId, values }: { sessionId: string; minutesId?: string; values: Record<string, any> }) => hazopSessionService.saveMinutes(studyId, sessionId, values, minutesId), onSuccess: invalidate }),
    approveMinutes: useMutation({ mutationFn: ({ sessionId, minutesId }: { sessionId: string; minutesId: string }) => hazopSessionService.approveMinutes(studyId, sessionId, minutesId), onSuccess: invalidate }),
    addDecision: useMutation({ mutationFn: ({ sessionId, values }: { sessionId: string; values: Record<string, any> }) => hazopSessionService.addDecision(studyId, sessionId, values), onSuccess: invalidate }),
    deleteDecision: useMutation({ mutationFn: ({ sessionId, decisionId }: { sessionId: string; decisionId: string }) => hazopSessionService.deleteDecision(studyId, sessionId, decisionId), onSuccess: invalidate }),
    createAction: useMutation({ mutationFn: ({ sessionId, values }: { sessionId: string; values: Record<string, any> }) => hazopSessionService.createAction(studyId, sessionId, values), onSuccess: invalidate }),
    syncActions: useMutation({ mutationFn: (sessionId: string) => hazopSessionService.syncActions(studyId, sessionId), onSuccess: invalidate })
  };
}
