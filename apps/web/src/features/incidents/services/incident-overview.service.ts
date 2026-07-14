import { api } from '@/services/api';
import type { IncidentOverview } from '../types/incident-overview.types';

const unwrap = <T,>(response: { data: { data: T } }) => response.data.data;

export const incidentOverviewService = {
  get: (incidentId: string) => api.get(`/incidents/${incidentId}/overview`).then(unwrap<IncidentOverview>),
  section: <T = any>(incidentId: string, section: string) => api.get(`/incidents/${incidentId}/overview/${section}`).then(unwrap<T>),
  quickActions: (incidentId: string) => api.get(`/incidents/${incidentId}/quick-actions`).then(unwrap<any[]>)
};
