import { api } from '@/services/api';
import type { Permit, PermitDashboard } from '@/services/ptw.service';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export type PTWRegisterFilters = {
  search?: string;
  status?: string;
  permitType?: string;
  riskLevel?: string;
  unitId?: string;
  areaId?: string;
  equipmentId?: string;
  holderId?: string;
  contractorCompanyId?: string;
  expiringWithin?: string;
  hasConflict?: string;
  gasRetestDue?: string;
  isolationPending?: string;
  handoverPending?: string;
  page?: string;
  limit?: string;
  sort?: string;
};

export const ptwDashboardService = {
  overview: () => api.get('/ptw/dashboard').then(unwrap<PermitDashboard>),
  kpis: () => api.get('/ptw/dashboard/kpis').then(unwrap<PermitDashboard['kpis']>),
  register: (params?: PTWRegisterFilters) => api.get('/ptw', { params }).then(unwrap<Permit[]>),
  alerts: () => api.get('/ptw/dashboard/alerts').then(unwrap<NonNullable<PermitDashboard['alerts']>>),
  expiring: () => api.get('/ptw/dashboard/expiring').then(unwrap<Record<string, Permit[]>>),
  gasRetest: () => api.get('/ptw/dashboard/gas-retest').then(unwrap<Record<string, unknown>>),
  conflicts: () => api.get('/ptw/dashboard/conflicts').then(unwrap<Record<string, unknown>>),
  isolation: () => api.get('/ptw/dashboard/isolation').then(unwrap<Record<string, Permit[]>>),
  handover: () => api.get('/ptw/dashboard/handover').then(unwrap<Record<string, Permit[]>>),
  safetyCritical: () => api.get('/ptw/dashboard/safety-critical').then(unwrap<Record<string, Permit[]>>),
  areaOverview: () => api.get('/ptw/dashboard/area-overview').then(unwrap<NonNullable<PermitDashboard['areaOverview']>>),
  preview: (id: string) => api.get(`/ptw/${id}/preview`).then(unwrap<Permit>),
  runConflictScan: () => api.post('/ptw/dashboard/run-conflict-scan').then(unwrap<{ scanned: number; conflicts: number }>),
  exportPdf: () => api.get('/ptw/dashboard/export/pdf').then(unwrap<Record<string, unknown>>),
  exportCsv: () => api.get('/ptw/dashboard/export/csv').then(unwrap<Record<string, unknown>>)
};
