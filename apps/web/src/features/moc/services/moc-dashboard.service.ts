import { api } from '@/services/api';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export type MOCDashboardFilters = {
  search?: string;
  status?: string;
  change_type?: string;
  risk_level?: string;
  site_id?: string;
  unit_id?: string;
  area_id?: string;
  department_id?: string;
  equipment_id?: string;
  originator_id?: string;
  current_approver_id?: string;
  workflow_status?: string;
  is_temporary?: boolean;
  is_emergency?: boolean;
  expiring_within_days?: number;
  overdue_temporary?: boolean;
  normalization_risk?: boolean;
  emergency_review_due?: boolean;
  emergency_review_overdue?: boolean;
  startup_blocked?: boolean;
  closure_blocked?: boolean;
  overdue_actions?: boolean;
  missing_evidence?: boolean;
  pending_verification?: boolean;
  pssr_required?: boolean;
  pssr_pending?: boolean;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  sort?: string;
};

export type MOCDashboardData = {
  kpis: Array<Record<string, any>>;
  riskOverview: Record<string, any>;
  typeDistribution: Array<Record<string, any>>;
  lifecycleHealth: Array<Record<string, any>>;
  register: { items: Array<Record<string, any>>; page: number; limit: number; total: number };
  temporary: Record<string, any>;
  emergency: Record<string, any>;
  actionHealth: Record<string, any>;
  approvalAging: Record<string, any>;
  approvalQueue: Record<string, any>;
  startupReadiness: Record<string, any>;
  recentActivity: Array<Record<string, any>>;
  generatedAt: string;
  realtime?: Record<string, any>;
};

export const mocDashboardService = {
  dashboard: (params?: MOCDashboardFilters) => api.get('/moc/dashboard', { params }).then(unwrap<MOCDashboardData>),
  register: (params?: MOCDashboardFilters) => api.get('/moc/dashboard/register', { params }).then(unwrap<any>),
  kpis: (params?: MOCDashboardFilters) => api.get('/moc/dashboard/kpis', { params }).then(unwrap<Record<string, any>>),
  riskOverview: (params?: MOCDashboardFilters) => api.get('/moc/dashboard/risk-overview', { params }).then(unwrap<Record<string, any>>),
  typeDistribution: (params?: MOCDashboardFilters) => api.get('/moc/dashboard/type-distribution', { params }).then(unwrap<Array<Record<string, any>>>),
  lifecycleHealth: (params?: MOCDashboardFilters) => api.get('/moc/dashboard/lifecycle-health', { params }).then(unwrap<Array<Record<string, any>>>),
  temporary: (params?: MOCDashboardFilters) => api.get('/moc/dashboard/temporary', { params }).then(unwrap<Record<string, any>>),
  emergency: (params?: MOCDashboardFilters) => api.get('/moc/dashboard/emergency', { params }).then(unwrap<Record<string, any>>),
  actionHealth: (params?: MOCDashboardFilters) => api.get('/moc/dashboard/action-health', { params }).then(unwrap<Record<string, any>>),
  approvalAging: (params?: MOCDashboardFilters) => api.get('/moc/dashboard/approval-aging', { params }).then(unwrap<Record<string, any>>),
  approvalQueue: (params?: MOCDashboardFilters) => api.get('/moc/dashboard/approval-queue', { params }).then(unwrap<Record<string, any>>),
  startupReadiness: (params?: MOCDashboardFilters) => api.get('/moc/dashboard/startup-readiness', { params }).then(unwrap<Record<string, any>>),
  recentActivity: (params?: MOCDashboardFilters) => api.get('/moc/dashboard/recent-activity', { params }).then(unwrap<Array<Record<string, any>>>),
  preview: (id: string) => api.get(`/moc/${id}/preview`).then(unwrap<Record<string, any>>),
  exportCsv: (params?: MOCDashboardFilters) => api.get('/moc/dashboard/export/csv', { params }).then(unwrap<any>),
  exportPdf: (params?: MOCDashboardFilters) => api.get('/moc/dashboard/export/pdf', { params }).then(unwrap<any>),
  exportReport: (report: 'register' | 'temporary' | 'high-critical' | 'audit-evidence') => api.get(`/moc/dashboard/export/${report}`).then(unwrap<any>)
};
