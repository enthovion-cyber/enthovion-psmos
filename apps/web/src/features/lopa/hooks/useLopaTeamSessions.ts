import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { lopaTeamSessionsService } from '../services/lopa-team-sessions.service';
import type { LopaSessionAgendaInput } from '../types/lopa-session-agenda.types';
import type { LopaSessionAttendanceInput } from '../types/lopa-session-attendance.types';
import type { LopaSessionDecisionInput, LopaSessionMinutesInput } from '../types/lopa-session-minutes.types';
import type { LopaSessionInput } from '../types/lopa-team-session.types';
import type { LopaTeamMemberInput, LopaTeamSessionsFilters } from '../types/lopa-team-member.types';

export function useLopaTeamSessions(id: string, filters: LopaTeamSessionsFilters = {}) {
  return useQuery({ queryKey: ['lopa', 'team-sessions', id, filters], queryFn: () => lopaTeamSessionsService.get(id, filters), enabled: !!id });
}

export function useLopaTeamSessionMutations(id: string) {
  const qc = useQueryClient();
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['lopa', 'team-sessions', id] });
    void qc.invalidateQueries({ queryKey: ['lopa', 'overview', id] });
    void qc.invalidateQueries({ queryKey: ['lopa', 'detail', id] });
  };
  return {
    createMember: useMutation({ mutationFn: (values: LopaTeamMemberInput) => lopaTeamSessionsService.createMember(id, values), onSuccess: refresh }),
    updateMember: useMutation({ mutationFn: ({ memberId, values }: { memberId: string; values: LopaTeamMemberInput }) => lopaTeamSessionsService.updateMember(id, memberId, values), onSuccess: refresh }),
    removeMember: useMutation({ mutationFn: ({ memberId, reason }: { memberId: string; reason?: string }) => lopaTeamSessionsService.removeMember(id, memberId, reason), onSuccess: refresh }),
    inviteMember: useMutation({ mutationFn: ({ memberId, message }: { memberId: string; message?: string }) => lopaTeamSessionsService.inviteMember(id, memberId, message), onSuccess: refresh }),
    resendInvite: useMutation({ mutationFn: (memberId: string) => lopaTeamSessionsService.resendInvite(id, memberId), onSuccess: refresh }),
    cancelInvite: useMutation({ mutationFn: ({ memberId, reason }: { memberId: string; reason?: string }) => lopaTeamSessionsService.cancelInvite(id, memberId, reason), onSuccess: refresh }),
    createSession: useMutation({ mutationFn: (values: LopaSessionInput) => lopaTeamSessionsService.createSession(id, values), onSuccess: refresh }),
    updateSession: useMutation({ mutationFn: ({ sessionId, values }: { sessionId: string; values: LopaSessionInput }) => lopaTeamSessionsService.updateSession(id, sessionId, values), onSuccess: refresh }),
    cancelSession: useMutation({ mutationFn: ({ sessionId, reason }: { sessionId: string; reason: string }) => lopaTeamSessionsService.cancelSession(id, sessionId, reason), onSuccess: refresh }),
    completeSession: useMutation({ mutationFn: (sessionId: string) => lopaTeamSessionsService.completeSession(id, sessionId), onSuccess: refresh }),
    lockMinutes: useMutation({ mutationFn: ({ sessionId, reason }: { sessionId: string; reason?: string }) => lopaTeamSessionsService.lockMinutes(id, sessionId, reason), onSuccess: refresh }),
    unlockMinutes: useMutation({ mutationFn: ({ sessionId, reason }: { sessionId: string; reason: string }) => lopaTeamSessionsService.unlockMinutes(id, sessionId, reason), onSuccess: refresh }),
    createAgenda: useMutation({ mutationFn: ({ sessionId, values }: { sessionId: string; values: LopaSessionAgendaInput }) => lopaTeamSessionsService.createAgenda(id, sessionId, values), onSuccess: refresh }),
    updateAttendance: useMutation({ mutationFn: ({ sessionId, rows }: { sessionId: string; rows: LopaSessionAttendanceInput[] }) => lopaTeamSessionsService.updateAttendance(id, sessionId, rows), onSuccess: refresh }),
    updateMinutes: useMutation({ mutationFn: ({ sessionId, values }: { sessionId: string; values: LopaSessionMinutesInput }) => lopaTeamSessionsService.updateMinutes(id, sessionId, values), onSuccess: refresh }),
    createDecision: useMutation({ mutationFn: ({ sessionId, values }: { sessionId: string; values: LopaSessionDecisionInput }) => lopaTeamSessionsService.createDecision(id, sessionId, values), onSuccess: refresh }),
    createAction: useMutation({ mutationFn: ({ sessionId, values }: { sessionId: string; values: Record<string, unknown> }) => lopaTeamSessionsService.createAction(id, sessionId, values), onSuccess: refresh }),
    syncActions: useMutation({ mutationFn: (sessionId: string) => lopaTeamSessionsService.syncActions(id, sessionId), onSuccess: refresh }),
    export: useMutation({ mutationFn: () => lopaTeamSessionsService.export(id) })
  };
}

export function useLopaTeamSessionDetail(id: string, sessionId?: string | null) {
  return useQuery({ queryKey: ['lopa', 'team-session-detail', id, sessionId], queryFn: () => lopaTeamSessionsService.sessionDetail(id, sessionId as string), enabled: !!id && !!sessionId });
}
