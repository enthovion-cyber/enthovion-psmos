'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hazopTeamService } from '../services/hazop-team.service';

export function useHazopTeamMutations(studyId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['hazop'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'team'] });
  };
  return {
    create: useMutation({ mutationFn: (values: Record<string, any>) => hazopTeamService.create(studyId, values), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ memberId, values }: { memberId: string; values: Record<string, any> }) => hazopTeamService.update(studyId, memberId, values), onSuccess: invalidate }),
    delete: useMutation({ mutationFn: (memberId: string) => hazopTeamService.delete(studyId, memberId), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: ({ memberId, reason }: { memberId: string; reason?: string }) => hazopTeamService.remove(studyId, memberId, reason), onSuccess: invalidate }),
    replace: useMutation({ mutationFn: ({ memberId, values }: { memberId: string; values: Record<string, any> }) => hazopTeamService.replace(studyId, memberId, values), onSuccess: invalidate }),
    resendInvite: useMutation({ mutationFn: (memberId: string) => hazopTeamService.resendInvite(studyId, memberId), onSuccess: invalidate }),
    exportReport: useMutation({ mutationFn: () => hazopTeamService.export(studyId) })
  };
}
