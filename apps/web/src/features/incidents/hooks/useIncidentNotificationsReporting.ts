import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { incidentNotificationsReportingService } from '../services/incident-notifications-reporting.service';
import type { IncidentNotificationsReportingData } from '../types/incident-notifications-reporting.types';

export function useIncidentNotificationsReporting(id: string) {
  return useQuery<IncidentNotificationsReportingData>({ queryKey: ['incidents', 'notifications-reporting', id], queryFn: () => incidentNotificationsReportingService.tab(id), enabled: !!id, refetchOnWindowFocus: false });
}

export function useIncidentNotificationsReportingMutations(id: string) {
  const queryClient = useQueryClient();
  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['incidents', 'notifications-reporting', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'detail', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'overview', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'dashboard'] })
  ]);
  return {
    runDetermination: useMutation({ mutationFn: (values: any) => incidentNotificationsReportingService.runDetermination(id, values), onSuccess: invalidate }),
    updateDetermination: useMutation({ mutationFn: (values: any) => incidentNotificationsReportingService.updateDetermination(id, values), onSuccess: invalidate }),
    sendNotification: useMutation({ mutationFn: (values: any) => incidentNotificationsReportingService.sendNotification(id, values), onSuccess: invalidate }),
    resendNotification: useMutation({ mutationFn: ({ notificationId, values }: any) => incidentNotificationsReportingService.resendNotification(id, notificationId, values), onSuccess: invalidate }),
    acknowledgeNotification: useMutation({ mutationFn: ({ notificationId, values }: any) => incidentNotificationsReportingService.acknowledgeNotification(id, notificationId, values), onSuccess: invalidate }),
    createReport: useMutation({ mutationFn: (values: any) => incidentNotificationsReportingService.createReport(id, values), onSuccess: invalidate }),
    updateReport: useMutation({ mutationFn: ({ reportId, values }: any) => incidentNotificationsReportingService.updateReport(id, reportId, values), onSuccess: invalidate }),
    generatePackage: useMutation({ mutationFn: ({ reportId, values }: any) => incidentNotificationsReportingService.generatePackage(id, reportId, values), onSuccess: invalidate }),
    requestApproval: useMutation({ mutationFn: ({ reportId, values }: any) => incidentNotificationsReportingService.requestApproval(id, reportId, values), onSuccess: invalidate }),
    markSubmitted: useMutation({ mutationFn: ({ reportId, values }: any) => incidentNotificationsReportingService.markSubmitted(id, reportId, values), onSuccess: invalidate }),
    addAcknowledgement: useMutation({ mutationFn: ({ reportId, values }: any) => incidentNotificationsReportingService.addAcknowledgement(id, reportId, values), onSuccess: invalidate }),
    markRejected: useMutation({ mutationFn: ({ reportId, values }: any) => incidentNotificationsReportingService.markRejected(id, reportId, values), onSuccess: invalidate }),
    createStakeholder: useMutation({ mutationFn: (values: any) => incidentNotificationsReportingService.createStakeholder(id, values), onSuccess: invalidate }),
    createFollowup: useMutation({ mutationFn: (values: any) => incidentNotificationsReportingService.createFollowup(id, values), onSuccess: invalidate }),
    requestReview: useMutation({ mutationFn: (values: any) => incidentNotificationsReportingService.requestReview(id, values), onSuccess: invalidate }),
    approveReview: useMutation({ mutationFn: (values: any) => incidentNotificationsReportingService.approveReview(id, values), onSuccess: invalidate }),
    rejectReview: useMutation({ mutationFn: (values: any) => incidentNotificationsReportingService.rejectReview(id, values), onSuccess: invalidate }),
    exportLog: useMutation({ mutationFn: () => incidentNotificationsReportingService.exportLog(id), onSuccess: invalidate })
  };
}
