import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { incidentInvestigationTeamService } from '../services/incident-investigation-team.service';

export function useIncidentInvestigationTeam(id: string) {
  return useQuery({ queryKey: ['incidents', 'investigation-team', id], queryFn: () => incidentInvestigationTeamService.tab(id), enabled: !!id, refetchOnWindowFocus: false });
}

export function useIncidentInvestigationTeamMutations(id: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['incidents', 'investigation-team', id] });
    void queryClient.invalidateQueries({ queryKey: ['incidents', 'detail', id] });
    void queryClient.invalidateQueries({ queryKey: ['incidents', 'overview', id] });
    void queryClient.invalidateQueries({ queryKey: ['incidents', 'dashboard'] });
  };
  return {
    createMember: useMutation({ mutationFn: (values: any) => incidentInvestigationTeamService.createMember(id, values), onSuccess: invalidate }),
    updateMember: useMutation({ mutationFn: ({ memberId, values }: any) => incidentInvestigationTeamService.updateMember(id, memberId, values), onSuccess: invalidate }),
    removeMember: useMutation({ mutationFn: ({ memberId, values }: any) => incidentInvestigationTeamService.removeMember(id, memberId, values), onSuccess: invalidate }),
    updateOwnerLead: useMutation({ mutationFn: (values: any) => incidentInvestigationTeamService.updateOwnerLead(id, values), onSuccess: invalidate }),
    acceptMember: useMutation({ mutationFn: ({ memberId, values }: any) => incidentInvestigationTeamService.acceptMember(id, memberId, values), onSuccess: invalidate }),
    declineMember: useMutation({ mutationFn: ({ memberId, values }: any) => incidentInvestigationTeamService.declineMember(id, memberId, values), onSuccess: invalidate }),
    replaceMember: useMutation({ mutationFn: ({ memberId, values }: any) => incidentInvestigationTeamService.replaceMember(id, memberId, values), onSuccess: invalidate }),
    generateRoles: useMutation({ mutationFn: () => incidentInvestigationTeamService.generateRoles(id), onSuccess: invalidate }),
    sendNotification: useMutation({ mutationFn: (values: any) => incidentInvestigationTeamService.sendNotification(id, values), onSuccess: invalidate }),
    sendReminders: useMutation({ mutationFn: (values: any) => incidentInvestigationTeamService.sendReminders(id, values), onSuccess: invalidate }),
    updateRaci: useMutation({ mutationFn: (values: any) => incidentInvestigationTeamService.updateRaci(id, values), onSuccess: invalidate }),
    updateChecks: useMutation({ mutationFn: (values: any) => incidentInvestigationTeamService.updateChecks(id, values), onSuccess: invalidate }),
    searchUsers: useMutation({ mutationFn: (values: any) => incidentInvestigationTeamService.searchUsers(id, values) }),
    requestReview: useMutation({ mutationFn: (values: any) => incidentInvestigationTeamService.requestReview(id, values), onSuccess: invalidate }),
    approveReview: useMutation({ mutationFn: (values: any) => incidentInvestigationTeamService.approveReview(id, values), onSuccess: invalidate }),
    rejectReview: useMutation({ mutationFn: (values: any) => incidentInvestigationTeamService.rejectReview(id, values), onSuccess: invalidate })
  };
}
