import { get, patch, post } from '@/features/audit/services/audit-api';
import type { RegulatoryReportDashboard, RegulatoryReportDetail, RegulatoryReportRegister } from '../types/regulatory-report.types';

const root = '/regulatory/reports';

export const regulatoryReportService = {
  dashboard: (params?: Record<string, unknown>) => get<RegulatoryReportDashboard>(`${root}/dashboard`, params),
  register: (params?: Record<string, unknown>) => get<RegulatoryReportRegister>(root, params),
  detail: (reportId: string) => get<RegulatoryReportDetail>(`${root}/${reportId}`),
  create: (data: Record<string, unknown>) => post<RegulatoryReportDetail>(root, data),
  update: (reportId: string, data: Record<string, unknown>) => patch<RegulatoryReportDetail>(`${root}/${reportId}`, data),
  generate: (data: Record<string, unknown>) => post<RegulatoryReportDetail>(`${root}/generate`, data),
  regenerate: (reportId: string, data: Record<string, unknown> = {}) => post<RegulatoryReportDetail>(`${root}/${reportId}/regenerate`, data),
  preview: (reportId: string) => post<Record<string, unknown>>(`${root}/${reportId}/preview`),
  download: (reportId: string) => post<Record<string, unknown>>(`${root}/${reportId}/download`),
  export: (reportId: string) => post<Record<string, unknown>>(`${root}/${reportId}/export`),
  lock: (reportId: string, reason?: string) => post<RegulatoryReportDetail>(`${root}/${reportId}/lock`, { reason }),
  unlock: (reportId: string, reason: string) => post<RegulatoryReportDetail>(`${root}/${reportId}/unlock`, { reason }),
  submitApproval: (reportId: string, reason?: string) => post<RegulatoryReportDetail>(`${root}/${reportId}/submit-approval`, { reason }),
  archive: (reportId: string, reason: string) => post<RegulatoryReportDetail>(`${root}/${reportId}/archive`, { reason }),
  templates: (params?: Record<string, unknown>) => get<{ rows: Record<string, unknown>[] }>(`${root}/templates`, params),
  createTemplate: (data: Record<string, unknown>) => post<Record<string, unknown>>(`${root}/templates`, data),
  jobs: (params?: Record<string, unknown>) => get<{ rows: Record<string, unknown>[] }>(`${root}/jobs`, params),
  packages: (params?: Record<string, unknown>) => get<{ rows: Record<string, unknown>[] }>(`${root}/packages`, params),
  createPackage: (data: Record<string, unknown>) => post<Record<string, unknown>>(`${root}/packages`, data),
  packageDetail: (packageId: string) => get<Record<string, unknown>>(`${root}/packages/${packageId}`),
  preparePackage: (packageId: string, data: Record<string, unknown> = {}) => post<Record<string, unknown>>(`${root}/packages/${packageId}/prepare`, data),
  generatePackageReport: (packageId: string, data: Record<string, unknown> = {}) => post<RegulatoryReportDetail>(`${root}/packages/${packageId}/generate-report`, data),
  history: (params?: Record<string, unknown>) => get<{ rows: Record<string, unknown>[] }>(`${root}/history`, params),
  accessLog: (params?: Record<string, unknown>) => get<{ rows: Record<string, unknown>[] }>(`${root}/access-log`, params),
  settings: () => get<Record<string, unknown>>(`${root}/settings`)
};
