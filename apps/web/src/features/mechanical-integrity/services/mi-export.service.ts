import { get, post } from './safeguard-api';
import type { MiExportCenter, MiExportJob, MiExportPackage } from '../types/mi-export.types';

export const miExportService = {
  center: (params: Record<string, unknown> = {}) => get<MiExportCenter>('/mechanical-integrity/export', params),
  createJob: (input: Record<string, unknown>) => post<{ job: MiExportJob; preview: unknown[] }>('/mechanical-integrity/export/jobs', input),
  jobs: (params: Record<string, unknown> = {}) => get<{ rows: MiExportJob[]; page: number; limit: number; total: number }>('/mechanical-integrity/export/jobs', params),
  job: (jobId: string) => get<{ row: MiExportJob; preview: unknown[] }>(`/mechanical-integrity/export/jobs/${jobId}`),
  cancelJob: (jobId: string) => post<MiExportJob>(`/mechanical-integrity/export/jobs/${jobId}/cancel`),
  packages: (params: Record<string, unknown> = {}) => get<{ rows: MiExportPackage[]; page: number; limit: number; total: number }>('/mechanical-integrity/export/packages', params),
  packageDetail: (packageId: string) => get<{ row: MiExportPackage; items: unknown[] }>(`/mechanical-integrity/export/packages/${packageId}`),
  equipmentIntegrityFile: (equipmentId: string, input: Record<string, unknown>) => post<{ package: MiExportPackage; exportJob: MiExportJob; manifest: Record<string, unknown> }>(`/mechanical-integrity/equipment/${equipmentId}/export/integrity-file`, input),
  lookups: () => Promise.all([
    get<string[]>('/mechanical-integrity/lookups/export-types'),
    get<string[]>('/mechanical-integrity/lookups/export-formats')
  ]).then(([exportTypes, exportFormats]) => ({ exportTypes, exportFormats }))
};
