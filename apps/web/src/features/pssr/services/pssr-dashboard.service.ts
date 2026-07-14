import { api } from '@/services/api';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export type PSSRDashboardFilters = Record<string, string | number | undefined>;

export const pssrDashboardService = {
  dashboard: (params?: PSSRDashboardFilters) => api.get('/pssr/dashboard', { params }).then(unwrap<any>),
  kpis: (params?: PSSRDashboardFilters) => api.get('/pssr/dashboard/kpis', { params }).then(unwrap<any[]>),
  readinessOverview: (params?: PSSRDashboardFilters) => api.get('/pssr/dashboard/readiness-overview', { params }).then(unwrap<any>),
  startupSchedule: (params?: PSSRDashboardFilters) => api.get('/pssr/dashboard/startup-schedule', { params }).then(unwrap<any[]>),
  blockersHealth: (params?: PSSRDashboardFilters) => api.get('/pssr/dashboard/blockers-health', { params }).then(unwrap<any[]>),
  punchHealth: (params?: PSSRDashboardFilters) => api.get('/pssr/dashboard/punch-health', { params }).then(unwrap<any>),
  authorizationQueue: (params?: PSSRDashboardFilters) => api.get('/pssr/dashboard/authorization-queue', { params }).then(unwrap<any[]>),
  linkedMocs: (params?: PSSRDashboardFilters) => api.get('/pssr/dashboard/linked-mocs', { params }).then(unwrap<any[]>),
  recentActivity: (params?: PSSRDashboardFilters) => api.get('/pssr/dashboard/recent-activity', { params }).then(unwrap<any[]>),
  exportCsv: (params?: PSSRDashboardFilters) => api.get('/pssr/dashboard/export/csv', { params }).then(unwrap<any>)
};
