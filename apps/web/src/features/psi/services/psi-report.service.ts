import { get, patch, post } from './psi-api';
import type { PsiExportJobDetail, PsiExportPackage, PsiExportJob, PsiGeneratedReport, PsiPackageDetail, PsiPaged, PsiReportDetail, PsiReportFile, PsiReportHistoryEvent, PsiReportsDashboard, PsiReportSettings, PsiReportTemplate, PsiScheduledReport } from '../types/psi-report.types';

const base = '/process-safety-information/reports';

export const psiReportService = {
  dashboard: (params?: Record<string, unknown>) => get<PsiReportsDashboard>(`${base}/dashboard`, params),
  summary: () => get<Record<string, number>>(`${base}/summary`),
  lookups: (kind: string) => get<string[]>(`${base}/lookups/${kind}`),
  templates: (params?: Record<string, unknown>) => get<PsiPaged<PsiReportTemplate>>(`${base}/templates`, params),
  template: (templateId: string) => get<PsiReportTemplate>(`${base}/templates/${templateId}`),
  createTemplate: (data: Record<string, unknown>) => post<PsiReportTemplate>(`${base}/templates`, data),
  updateTemplate: (templateId: string, data: Record<string, unknown>) => patch<PsiReportTemplate>(`${base}/templates/${templateId}`, data),
  archiveTemplate: (templateId: string, data: Record<string, unknown>) => post<PsiReportTemplate>(`${base}/templates/${templateId}/archive`, data),
  cloneTemplate: (templateId: string, data?: Record<string, unknown>) => post<PsiReportTemplate>(`${base}/templates/${templateId}/clone`, data),
  generate: (data: Record<string, unknown>) => post<PsiGeneratedReport & { files?: PsiReportFile[] }>(`${base}/generate`, data),
  generated: (params?: Record<string, unknown>) => get<PsiPaged<PsiGeneratedReport>>(`${base}/generated`, params),
  report: (reportId: string) => get<PsiReportDetail>(`${base}/generated/${reportId}`),
  preview: (reportId: string) => get<Record<string, unknown>>(`${base}/generated/${reportId}/preview`),
  files: (reportId: string) => get<PsiReportFile[]>(`${base}/generated/${reportId}/files`),
  regenerate: (reportId: string, data?: Record<string, unknown>) => post<PsiGeneratedReport>(`${base}/generated/${reportId}/regenerate`, data),
  archiveReport: (reportId: string, data: Record<string, unknown>) => post<PsiGeneratedReport>(`${base}/generated/${reportId}/archive`, data),
  downloadFile: (fileId: string) => get<Record<string, unknown>>(`${base}/files/${fileId}/download`),
  exportCreate: (data: Record<string, unknown>) => post<PsiExportJob & { package?: PsiPackageDetail }>(`${base}/export`, data),
  exportJobs: (params?: Record<string, unknown>) => get<PsiPaged<PsiExportJob>>(`${base}/export/jobs`, params),
  exportJob: (jobId: string) => get<PsiExportJobDetail>(`${base}/export/jobs/${jobId}`),
  cancelExport: (jobId: string, data: Record<string, unknown>) => post<PsiExportJob>(`${base}/export/jobs/${jobId}/cancel`, data),
  retryExport: (jobId: string) => post<PsiExportJob>(`${base}/export/jobs/${jobId}/retry`),
  packages: (params?: Record<string, unknown>) => get<PsiPaged<PsiExportPackage>>(`${base}/export/packages`, params),
  package: (packageId: string) => get<PsiPackageDetail>(`${base}/export/packages/${packageId}`),
  packageManifest: (packageId: string) => get<PsiPackageDetail>(`${base}/export/packages/${packageId}/manifest`),
  archivePackage: (packageId: string, data: Record<string, unknown>) => post<PsiExportPackage>(`${base}/export/packages/${packageId}/archive`, data),
  scheduled: (params?: Record<string, unknown>) => get<PsiPaged<PsiScheduledReport>>(`${base}/scheduled`, params),
  schedule: (scheduleId: string) => get<PsiScheduledReport>(`${base}/scheduled/${scheduleId}`),
  createSchedule: (data: Record<string, unknown>) => post<PsiScheduledReport>(`${base}/scheduled`, data),
  updateSchedule: (scheduleId: string, data: Record<string, unknown>) => patch<PsiScheduledReport>(`${base}/scheduled/${scheduleId}`, data),
  runSchedule: (scheduleId: string) => post<PsiGeneratedReport>(`${base}/scheduled/${scheduleId}/run-now`),
  archiveSchedule: (scheduleId: string, data: Record<string, unknown>) => post<PsiScheduledReport>(`${base}/scheduled/${scheduleId}/archive`, data),
  settings: () => get<PsiReportSettings>(`${base}/settings`),
  updateSettings: (data: Record<string, unknown>) => patch<PsiReportSettings>(`${base}/settings`, data),
  history: (params?: Record<string, unknown>) => get<PsiReportHistoryEvent[]>(`${base}/history`, params),
  unitReports: (unitId: string, params?: Record<string, unknown>) => get<PsiPaged<PsiGeneratedReport>>(`/process-safety-information/units/${unitId}/reports`, params),
  unitGenerate: (unitId: string, data: Record<string, unknown>) => post<PsiGeneratedReport>(`/process-safety-information/units/${unitId}/reports/generate`, data),
  unitExport: (unitId: string, data: Record<string, unknown>) => post<PsiExportJob>(`/process-safety-information/units/${unitId}/export`, data),
  equipmentReports: (equipmentId: string, params?: Record<string, unknown>) => get<PsiPaged<PsiGeneratedReport>>(`/process-safety-information/equipment/${equipmentId}/reports`, params),
  equipmentExport: (equipmentId: string, data: Record<string, unknown>) => post<PsiExportJob>(`/process-safety-information/equipment/${equipmentId}/export`, data),
  moduleReports: (moduleKey: string, params?: Record<string, unknown>) => get<Record<string, unknown>>(`/process-safety-information/${moduleKey}/reports`, params)
};

export const psiReportTemplateService = psiReportService;
export const psiExportService = psiReportService;
export const psiScheduledReportService = psiReportService;
