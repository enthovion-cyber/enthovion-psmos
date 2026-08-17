import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { trainingReportsService } from '../services/training-reports.service';

const key = (name: string, params?: Record<string, unknown>) => ['training', 'reports', name, params ?? {}];

export function useTrainingReportsDashboard(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: key('dashboard', params), queryFn: () => trainingReportsService.dashboard(params) });
}
export function useTrainingReportTemplates(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: key('templates', params), queryFn: () => trainingReportsService.templates(params) });
}
export function useTrainingReportTemplate(templateId?: string) {
  return useQuery({ queryKey: key('template-detail', { templateId }), queryFn: () => trainingReportsService.template(templateId as string), enabled: Boolean(templateId) });
}
export function useTrainingGeneratedReports(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: key('generated', params), queryFn: () => trainingReportsService.generated(params) });
}
export function useTrainingGeneratedReport(reportId?: string) {
  return useQuery({ queryKey: key('generated-detail', { reportId }), queryFn: () => trainingReportsService.generatedDetail(reportId as string), enabled: Boolean(reportId) });
}
export function useTrainingExportJobs(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: key('jobs', params), queryFn: () => trainingReportsService.exportJobs(params) });
}
export function useTrainingExportJob(jobId?: string) {
  return useQuery({ queryKey: key('job-detail', { jobId }), queryFn: () => trainingReportsService.exportJob(jobId as string), enabled: Boolean(jobId) });
}
export function useTrainingReportPackages(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: key('packages', params), queryFn: () => trainingReportsService.packages(params) });
}
export function useTrainingReportPackage(packageId?: string) {
  return useQuery({ queryKey: key('package-detail', { packageId }), queryFn: () => trainingReportsService.packageDetail(packageId as string), enabled: Boolean(packageId) });
}
export function useTrainingScheduledReports(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: key('scheduled', params), queryFn: () => trainingReportsService.scheduled(params) });
}
export function useTrainingScheduledReport(scheduledReportId?: string) {
  return useQuery({ queryKey: key('scheduled-detail', { scheduledReportId }), queryFn: () => trainingReportsService.scheduledDetail(scheduledReportId as string), enabled: Boolean(scheduledReportId) });
}
export function useTrainingReportDownloads(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: key('downloads', params), queryFn: () => trainingReportsService.downloads(params) });
}
export function useTrainingAuditEvidence(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: key('audit-evidence', params), queryFn: () => trainingReportsService.auditEvidence(params) });
}
export function useTrainingReportHistory(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: key('history', params), queryFn: () => trainingReportsService.history(params) });
}
export function useTrainingReportSettings(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: key('settings', params), queryFn: () => trainingReportsService.settings(params) });
}
export function useTrainingReportLookups() {
  return useQuery({ queryKey: key('lookups'), queryFn: () => trainingReportsService.lookups() });
}
export function useTrainingReportView(reportType: string, params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: key('view', { reportType, ...params }), queryFn: () => trainingReportsService.reportView(reportType, params) });
}
export function useTrainingScopedReports(scope: 'sites' | 'units' | 'areas', id: string) {
  return useQuery({ queryKey: key('scoped', { scope, id }), queryFn: () => trainingReportsService.scopedReports(scope, id), enabled: Boolean(id) });
}
export function useTrainingWorkerReports(workerId: string) {
  return useQuery({ queryKey: key('worker', { workerId }), queryFn: () => trainingReportsService.workerReports(workerId), enabled: Boolean(workerId) });
}
export function useTrainingReportMutations() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ['training', 'reports'] });
  return {
    createTemplate: useMutation({ mutationFn: trainingReportsService.createTemplate, onSuccess: invalidate }),
    updateTemplate: useMutation({ mutationFn: ({ templateId, data }: { templateId: string; data: Record<string, any> }) => trainingReportsService.updateTemplate(templateId, data), onSuccess: invalidate }),
    archiveTemplate: useMutation({ mutationFn: ({ templateId, reason }: { templateId: string; reason?: string }) => trainingReportsService.archiveTemplate(templateId, reason), onSuccess: invalidate }),
    activateTemplate: useMutation({ mutationFn: trainingReportsService.activateTemplate, onSuccess: invalidate }),
    preview: useMutation({ mutationFn: trainingReportsService.preview }),
    generate: useMutation({ mutationFn: trainingReportsService.generate, onSuccess: invalidate }),
    exportReport: useMutation({ mutationFn: trainingReportsService.exportReport, onSuccess: invalidate }),
    retryJob: useMutation({ mutationFn: trainingReportsService.retryJob, onSuccess: invalidate }),
    cancelJob: useMutation({ mutationFn: ({ jobId, reason }: { jobId: string; reason?: string }) => trainingReportsService.cancelJob(jobId, reason), onSuccess: invalidate }),
    createPackage: useMutation({ mutationFn: trainingReportsService.createPackage, onSuccess: invalidate }),
    regeneratePackage: useMutation({ mutationFn: trainingReportsService.regeneratePackage, onSuccess: invalidate }),
    createScheduled: useMutation({ mutationFn: trainingReportsService.createScheduled, onSuccess: invalidate }),
    updateScheduled: useMutation({ mutationFn: ({ scheduledReportId, data }: { scheduledReportId: string; data: Record<string, any> }) => trainingReportsService.updateScheduled(scheduledReportId, data), onSuccess: invalidate }),
    runScheduledNow: useMutation({ mutationFn: trainingReportsService.runScheduledNow, onSuccess: invalidate }),
    pauseScheduled: useMutation({ mutationFn: trainingReportsService.pauseScheduled, onSuccess: invalidate }),
    resumeScheduled: useMutation({ mutationFn: trainingReportsService.resumeScheduled, onSuccess: invalidate }),
    downloadFile: useMutation({ mutationFn: trainingReportsService.downloadFile, onSuccess: invalidate }),
    downloadPackage: useMutation({ mutationFn: trainingReportsService.downloadPackage, onSuccess: invalidate }),
    updateSettings: useMutation({ mutationFn: trainingReportsService.updateSettings, onSuccess: invalidate }),
    workerEvidencePackage: useMutation({ mutationFn: trainingReportsService.workerEvidencePackage, onSuccess: invalidate }),
    mocEvidencePackage: useMutation({ mutationFn: trainingReportsService.mocEvidencePackage, onSuccess: invalidate }),
    pssrEvidencePackage: useMutation({ mutationFn: trainingReportsService.pssrEvidencePackage, onSuccess: invalidate }),
    ptwEvidencePackage: useMutation({ mutationFn: trainingReportsService.ptwEvidencePackage, onSuccess: invalidate })
  };
}
