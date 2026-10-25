import { api } from '@/services/api';
import type {
  ExecutiveReport,
  ExecutiveReportVersion,
  ExecutiveReportType,
  ExecutiveReportTemplate,
  ExecutiveReportingPeriod,
  ExecutiveReportAudience,
  ExecutiveReportArtifact,
  ExecutiveReportSourceManifest,
  ExecutiveReportManifestItem,
  ExecutiveReportSchedule,
  ExecutiveReportDistribution,
  ExecutiveReportDashboard,
  ExecutiveBoardDashboard,
} from '../types/executive-report.types';

type Row = Record<string, any>;

function unwrap<T>(response: { data: T | { data?: T } }) {
  const body = response.data as { data?: T };
  return body && typeof body === 'object' && 'data' in body ? (body.data as T) : (response.data as T);
}

const get = <T>(path: string, params?: Row) => api.get(path, { params }).then(unwrap<T>);
const post = <T>(path: string, body?: Row) => api.post(path, body ?? {}).then(unwrap<T>);
const patch = <T>(path: string, body?: Row) => api.patch(path, body ?? {}).then(unwrap<T>);

export const executiveReportApi = {
  // Dashboard & Lookups
  dashboard: (params?: Row) => get<ExecutiveReportDashboard>('/executive/reports/dashboard', params),
  lookups: () => get<Row>('/executive/reports/lookups'),

  // Board Reporting
  boardDashboard: (params?: Row) => get<ExecutiveBoardDashboard>('/executive/reports/board/dashboard', params),
  boardPackages: (params?: Row) => get<{ rows: ExecutiveReport[]; total: number }>('/executive/reports/board/packages', params),
  createBoardPackage: (body: Row) => post<{ report: ExecutiveReport; version: ExecutiveReportVersion }>('/executive/reports/board/packages', body),

  // Report Register & CRUD
  register: (params?: Row) => get<{ rows: ExecutiveReport[]; total: number; offset: number; limit: number }>('/executive/reports', params),
  reports: (params?: Row) => get<{ rows: ExecutiveReport[]; total: number; offset: number; limit: number }>('/executive/reports', params),
  detail: (id: string) => get<{ report: ExecutiveReport; versions: ExecutiveReportVersion[] }>(`/executive/reports/${id}`),
  create: (body: Row) => post<{ report: ExecutiveReport; version: ExecutiveReportVersion }>('/executive/reports', body),
  update: (id: string, body: Row) => patch<ExecutiveReport>(`/executive/reports/${id}`, body),
  archive: (id: string, body?: Row) => post<{ id: string; status: string }>(`/executive/reports/${id}/archive`, body),

  // Validation, Readiness & Previews
  validate: (id: string) => post<Row>(`/executive/reports/${id}/validate`),
  readiness: (id: string) => get<Row>(`/executive/reports/${id}/readiness`),
  contents: (id: string) => get<Row>(`/executive/reports/${id}/contents`),
  sources: (id: string) => get<{ manifest: ExecutiveReportSourceManifest; items: ExecutiveReportManifestItem[]; count: number }>(`/executive/reports/${id}/sources`),
  preview: (id: string) => get<Row>(`/executive/reports/${id}/preview`),

  // Governance Lifecycle & Approvals
  submitApproval: (id: string, body?: Row) => post<{ status: string; versionId: string }>(`/executive/reports/${id}/submit-approval`, body),
  approve: (id: string, body?: Row) => post<{ status: string; versionId: string; approvedAt: string }>(`/executive/reports/${id}/approve`, body),
  reject: (id: string, body?: Row) => post<{ status: string; versionId: string }>(`/executive/reports/${id}/reject`, body),
  publish: (id: string, body?: Row) => post<{ status: string; publishedAt: string }>(`/executive/reports/${id}/publish`, body),
  createVersion: (id: string, body?: Row) => post<{ version: ExecutiveReportVersion; reportId: string }>(`/executive/reports/${id}/create-version`, body),

  // Generation & Artifacts
  generate: (id: string, format: string) => post<{ artifact: ExecutiveReportArtifact; readiness: any; message: string }>(`/executive/reports/${id}/generate`, { format }),
  artifacts: (id: string) => get<{ rows: ExecutiveReportArtifact[] }>(`/executive/reports/${id}/artifacts`),
  download: (artifactId: string) => get<Row>(`/executive/reports/artifacts/${artifactId}/download`),
  downloadArtifact: (artifactId: string) => get<Row>(`/executive/reports/artifacts/${artifactId}/download`),

  // Distribution
  distribution: (id: string) => get<{ rows: ExecutiveReportDistribution[] }>(`/executive/reports/${id}/distribution`),
  sendDistribution: (id: string, body?: Row) => post<ExecutiveReportDistribution>(`/executive/reports/${id}/distribution/send`, body),
  revokeDistribution: (distId: string, body?: Row) => post<ExecutiveReportDistribution>(`/executive/reports/distribution/${distId}/revoke`, body),

  // Templates
  templates: () => get<{ rows: ExecutiveReportTemplate[] }>('/executive/reports/templates'),
  createTemplate: (body: Row) => post<ExecutiveReportTemplate>('/executive/reports/templates', body),
  updateTemplate: (id: string, body: Row) => patch<ExecutiveReportTemplate>(`/executive/reports/templates/${id}`, body),

  // Types & Periods
  types: () => get<{ rows: ExecutiveReportType[] }>('/executive/reports/types'),
  periods: (params?: Row) => get<{ rows: ExecutiveReportingPeriod[] }>('/executive/reports/periods', params),
  createPeriod: (body: Row) => post<ExecutiveReportingPeriod>('/executive/reports/periods', body),
  updatePeriod: (id: string, body: Row) => patch<ExecutiveReportingPeriod>(`/executive/reports/periods/${id}`, body),

  // Audiences & Schedules
  audiences: () => get<{ rows: ExecutiveReportAudience[] }>('/executive/reports/audiences'),
  createAudience: (body: Row) => post<ExecutiveReportAudience>('/executive/reports/audiences', body),
  updateAudience: (id: string, body: Row) => patch<ExecutiveReportAudience>(`/executive/reports/audiences/${id}`, body),

  schedules: () => get<{ rows: ExecutiveReportSchedule[] }>('/executive/reports/schedules'),
  createSchedule: (body: Row) => post<ExecutiveReportSchedule>('/executive/reports/schedules', body),
  updateSchedule: (id: string, body: Row) => patch<ExecutiveReportSchedule>(`/executive/reports/schedules/${id}`, body),

  // Audit History & Staleness
  versions: (id: string) => get<{ rows: ExecutiveReportVersion[] }>(`/executive/reports/${id}/versions`),
  history: (id: string) => get<{ rows: Row[] }>(`/executive/reports/${id}/history`),
  staleness: (id?: string) => get<{ rows: Row[] }>(id ? `/executive/reports/${id}/staleness` : '/executive/reports/staleness'),
  triggerStaleness: (reportId?: string) => post<Row>(reportId ? `/executive/reports/${reportId}/staleness/trigger` : '/executive/reports/staleness/trigger'),
};
