import { api } from '@/services/api';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const hazopDashboardService = {
  summary: () => api.get('/hazop/dashboard/summary').then(unwrap<any>),
  dashboard: () => api.get('/hazop/dashboard').then(unwrap<any>),
  studies: (params?: Record<string, any>) => api.get('/hazop/dashboard/studies', { params }).then(unwrap<any[]>),
  riskOverview: () => api.get('/hazop/dashboard/risk-overview').then(unwrap<any>),
  statusDistribution: () => api.get('/hazop/dashboard/status-distribution').then(unwrap<any[]>),
  recommendationHealth: () => api.get('/hazop/dashboard/recommendation-health').then(unwrap<any>),
  revalidationDue: () => api.get('/hazop/dashboard/revalidation-due').then(unwrap<any[]>),
  overdue: () => api.get('/hazop/dashboard/overdue').then(unwrap<any[]>),
  highCritical: () => api.get('/hazop/dashboard/high-critical').then(unwrap<any[]>),
  lopaRequired: () => api.get('/hazop/dashboard/lopa-required').then(unwrap<any[]>),
  teamSignoff: () => api.get('/hazop/dashboard/team-signoff').then(unwrap<any>),
  recentActivity: () => api.get('/hazop/dashboard/recent-activity').then(unwrap<any[]>),
  trends: () => api.get('/hazop/dashboard/trends').then(unwrap<any>),
  export: () => api.post('/hazop/dashboard/export').then(unwrap<any>)
};
