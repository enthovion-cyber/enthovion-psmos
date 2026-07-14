import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { incidentFinalReportService } from '../services/incident-final-report.service';
import type { IncidentFinalReportData } from '../types/incident-final-report.types';

export function useIncidentFinalReport(id: string) {
  return useQuery<IncidentFinalReportData>({ queryKey: ['incidents', 'final-report', id], queryFn: () => incidentFinalReportService.tab(id), enabled: !!id, refetchOnWindowFocus: false });
}

export function useIncidentFinalReportMutations(id: string) {
  const queryClient = useQueryClient();
  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['incidents', 'final-report', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'detail', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'overview', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'dashboard'] })
  ]);
  return {
    runReadiness: useMutation({ mutationFn: (values: any) => incidentFinalReportService.runReadiness(id, values), onSuccess: invalidate }),
    selectTemplate: useMutation({ mutationFn: (values: any) => incidentFinalReportService.selectTemplate(id, values), onSuccess: invalidate }),
    updateSections: useMutation({ mutationFn: (values: any) => incidentFinalReportService.updateSections(id, values), onSuccess: invalidate }),
    createSnapshot: useMutation({ mutationFn: (values: any) => incidentFinalReportService.createSnapshot(id, values), onSuccess: invalidate }),
    generate: useMutation({ mutationFn: (values: any) => incidentFinalReportService.generate(id, values), onSuccess: invalidate }),
    exportReport: useMutation({ mutationFn: ({ exportType, values }: any) => incidentFinalReportService.export(id, exportType, values), onSuccess: invalidate }),
    markOfficial: useMutation({ mutationFn: ({ reportId, values }: any) => incidentFinalReportService.markOfficial(id, reportId, values), onSuccess: invalidate }),
    publish: useMutation({ mutationFn: ({ reportId, values }: any) => incidentFinalReportService.publish(id, reportId, values), onSuccess: invalidate }),
    supersede: useMutation({ mutationFn: ({ reportId, values }: any) => incidentFinalReportService.supersede(id, reportId, values), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: ({ reportId, values }: any) => incidentFinalReportService.archive(id, reportId, values), onSuccess: invalidate }),
    requestReview: useMutation({ mutationFn: (values: any) => incidentFinalReportService.requestReview(id, values), onSuccess: invalidate }),
    approveReview: useMutation({ mutationFn: (values: any) => incidentFinalReportService.approveReview(id, values), onSuccess: invalidate }),
    rejectReview: useMutation({ mutationFn: (values: any) => incidentFinalReportService.rejectReview(id, values), onSuccess: invalidate })
  };
}
