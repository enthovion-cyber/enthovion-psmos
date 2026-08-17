import { get, patch, post } from './safeguard-api';
import type { MiGeneratedReport, MiReportTemplate, MiReportsDashboard, MiScheduledReport } from '../types/mi-report.types';

export const miReportService = {
  dashboard: (params: Record<string, unknown> = {}) => get<MiReportsDashboard>('/mechanical-integrity/reports', params),
  templates: (params: Record<string, unknown> = {}) => get<MiReportTemplate[]>('/mechanical-integrity/reports/templates', params),
  createTemplate: (input: Record<string, unknown>) => post<MiReportTemplate>('/mechanical-integrity/reports/templates', input),
  updateTemplate: (templateId: string, input: Record<string, unknown>) => patch<MiReportTemplate>(`/mechanical-integrity/reports/templates/${templateId}`, input),
  archiveTemplate: (templateId: string) => post<MiReportTemplate>(`/mechanical-integrity/reports/templates/${templateId}/archive`),
  generate: (input: Record<string, unknown>) => post<{ row: MiGeneratedReport; preview: unknown[] }>('/mechanical-integrity/reports/generate', input),
  generated: (params: Record<string, unknown> = {}) => get<{ rows: MiGeneratedReport[]; page: number; limit: number; total: number }>('/mechanical-integrity/reports/generated', params),
  scheduled: (params: Record<string, unknown> = {}) => get<{ rows: MiScheduledReport[]; page: number; limit: number; total: number }>('/mechanical-integrity/reports/scheduled', params),
  createSchedule: (input: Record<string, unknown>) => post<MiScheduledReport>('/mechanical-integrity/reports/scheduled', input),
  lookups: () => Promise.all([
    get<string[]>('/mechanical-integrity/lookups/report-categories'),
    get<Record<string, string[]>>('/mechanical-integrity/lookups/report-types'),
    get<string[]>('/mechanical-integrity/lookups/export-formats')
  ]).then(([reportCategories, reportTypes, exportFormats]) => ({ reportCategories, reportTypes, exportFormats }))
};
