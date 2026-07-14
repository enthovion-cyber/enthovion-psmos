import { api } from '@/services/api';
import type { IncidentDashboardData, IncidentFilters } from '../types/incident.types';
const unwrap = <T,>(response: { data: { data: T } }) => response.data.data;
export const incidentRegisterService = {
  dashboard: (filters: IncidentFilters = {}) => api.get('/incidents', { params: filters }).then(unwrap<IncidentDashboardData>),
  summary: () => api.get('/incidents/summary').then(unwrap<any>),
  attention: () => api.get('/incidents/attention').then(unwrap<any>),
  psmEvents: () => api.get('/incidents/psm-events').then(unwrap<any>),
  highPotential: () => api.get('/incidents/high-potential').then(unwrap<any>),
  investigationStatus: () => api.get('/incidents/investigation-status').then(unwrap<any>),
  actionSnapshot: () => api.get('/incidents/action-snapshot').then(unwrap<any>),
  trends: () => api.get('/incidents/trends').then(unwrap<any>),
  register: (filters: IncidentFilters = {}) => api.get('/incidents/register', { params: filters }).then(unwrap<any>),
  context: () => api.get('/incidents/filters/context').then(unwrap<any>),
  savedViews: () => api.get('/incidents/saved-views').then(unwrap<any[]>),
  saveView: (values: any) => api.post('/incidents/saved-views', values).then(unwrap<any>),
  updateView: (id: string, values: any) => api.patch(`/incidents/saved-views/${id}`, values).then(unwrap<any>),
  deleteView: (id: string) => api.delete(`/incidents/saved-views/${id}`).then(unwrap<any>),
  bulkUpdate: (values: any) => api.post('/incidents/bulk-update', values).then(unwrap<any>),
  bulkAssign: (values: any) => api.post('/incidents/bulk-assign', values).then(unwrap<any>),
  bulkCreateAction: (values: any) => api.post('/incidents/bulk-create-action', values).then(unwrap<any>),
  exportRegister: (filters: IncidentFilters = {}) => api.get('/incidents/export', { params: filters }).then(unwrap<any>),
  exportPsm: (filters: IncidentFilters = {}) => api.get('/incidents/export/psm-events', { params: filters }).then(unwrap<any>),
  exportHighPotential: (filters: IncidentFilters = {}) => api.get('/incidents/export/high-potential', { params: filters }).then(unwrap<any>),
  exportOverdue: (filters: IncidentFilters = {}) => api.get('/incidents/export/overdue', { params: filters }).then(unwrap<any>)
};
