import { api } from '@/services/api';
import type { LopaFinalReportData, LopaFinalReportFilters, LopaReportGenerateInput, LopaReportPackageInput, LopaReportPublishInput, LopaReportShareInput } from '../types/lopa-final-report.types';

const unwrap = <T,>(r: { data: { data: T } }) => r.data.data;

export const lopaFinalReportService = {
  get: (id: string, filters: LopaFinalReportFilters = {}) => api.get(`/lopa/${id}/final-report`, { params: filters }).then(unwrap<LopaFinalReportData>),
  summary: (id: string) => api.get(`/lopa/${id}/final-report/summary`).then(unwrap<Record<string, any>>),
  readiness: (id: string) => api.get(`/lopa/${id}/final-report/readiness`).then(unwrap<any>),
  templates: (id: string) => api.get(`/lopa/${id}/final-report/templates`).then(unwrap<any[]>),
  sections: (id: string) => api.get(`/lopa/${id}/final-report/sections`).then(unwrap<any[]>),
  updateSections: (id: string, values: { sections: any[]; reason?: string }) => api.patch(`/lopa/${id}/final-report/sections`, values).then(unwrap<any[]>),
  preview: (id: string, values: LopaReportGenerateInput) => api.post(`/lopa/${id}/final-report/preview`, values).then(unwrap<any>),
  generate: (id: string, values: LopaReportGenerateInput) => api.post(`/lopa/${id}/final-report/generate`, values).then(unwrap<any>),
  generatePackage: (id: string, values: LopaReportPackageInput) => api.post(`/lopa/${id}/final-report/generate-package`, values).then(unwrap<any>),
  reports: (id: string, filters: LopaFinalReportFilters = {}) => api.get(`/lopa/${id}/final-report/reports`, { params: filters }).then(unwrap<any>),
  reportDetail: (id: string, reportId: string) => api.get(`/lopa/${id}/final-report/reports/${reportId}`).then(unwrap<any>),
  reportPreview: (id: string, reportId: string) => api.get(`/lopa/${id}/final-report/reports/${reportId}/preview`).then(unwrap<any>),
  markOfficial: (id: string, reportId: string, reason: string) => api.post(`/lopa/${id}/final-report/reports/${reportId}/mark-official`, { reason }).then(unwrap<any>),
  publish: (id: string, reportId: string, values: LopaReportPublishInput) => api.post(`/lopa/${id}/final-report/reports/${reportId}/publish-document-control`, values).then(unwrap<any>),
  supersede: (id: string, reportId: string, reason: string) => api.post(`/lopa/${id}/final-report/reports/${reportId}/supersede`, { reason }).then(unwrap<any>),
  archive: (id: string, reportId: string, reason?: string) => api.post(`/lopa/${id}/final-report/reports/${reportId}/archive`, { reason }).then(unwrap<any>),
  restore: (id: string, reportId: string, reason?: string) => api.post(`/lopa/${id}/final-report/reports/${reportId}/restore`, { reason }).then(unwrap<any>),
  snapshots: (id: string) => api.get(`/lopa/${id}/final-report/source-snapshot`).then(unwrap<any[]>),
  createSnapshot: (id: string) => api.post(`/lopa/${id}/final-report/source-snapshot`).then(unwrap<any>),
  appendices: (id: string) => api.get(`/lopa/${id}/final-report/appendices`).then(unwrap<any[]>),
  previewAppendix: (id: string, appendixKey: string) => api.post(`/lopa/${id}/final-report/appendices/${appendixKey}/preview`).then(unwrap<any>),
  exportAppendix: (id: string, appendixKey: string, values: LopaReportGenerateInput) => api.post(`/lopa/${id}/final-report/appendices/${appendixKey}/export`, values).then(unwrap<any>),
  packages: (id: string) => api.get(`/lopa/${id}/final-report/packages`).then(unwrap<any[]>),
  packageDetail: (id: string, packageId: string) => api.get(`/lopa/${id}/final-report/packages/${packageId}`).then(unwrap<any>),
  archivePackage: (id: string, packageId: string, reason?: string) => api.post(`/lopa/${id}/final-report/packages/${packageId}/archive`, { reason }).then(unwrap<any>),
  restorePackage: (id: string, packageId: string, reason?: string) => api.post(`/lopa/${id}/final-report/packages/${packageId}/restore`, { reason }).then(unwrap<any>),
  redaction: (id: string, values?: LopaReportGenerateInput) => values ? api.post(`/lopa/${id}/final-report/redaction-preview`, values).then(unwrap<any>) : api.get(`/lopa/${id}/final-report/redaction-preview`).then(unwrap<any>),
  exportHistory: (id: string) => api.get(`/lopa/${id}/final-report/export-history`).then(unwrap<any[]>),
  exportExcel: (id: string, values: LopaReportGenerateInput) => api.post(`/lopa/${id}/final-report/export-excel`, values).then(unwrap<any>),
  exportCsv: (id: string, values: LopaReportGenerateInput) => api.post(`/lopa/${id}/final-report/export-csv`, values).then(unwrap<any>),
  exportAuditPackage: (id: string, values: LopaReportPackageInput) => api.post(`/lopa/${id}/final-report/export-audit-package`, values).then(unwrap<any>),
  distribution: (id: string) => api.get(`/lopa/${id}/final-report/distribution`).then(unwrap<any[]>),
  share: (id: string, values: LopaReportShareInput) => api.post(`/lopa/${id}/final-report/distribution/share`, values).then(unwrap<any>),
  revokeShare: (id: string, distributionId: string, reason?: string) => api.post(`/lopa/${id}/final-report/distribution/${distributionId}/revoke`, { reason }).then(unwrap<any>),
  resendShare: (id: string, distributionId: string) => api.post(`/lopa/${id}/final-report/distribution/${distributionId}/resend`).then(unwrap<any>),
  context: (id: string) => api.get(`/lopa/${id}/final-report/context`).then(unwrap<any>)
};
