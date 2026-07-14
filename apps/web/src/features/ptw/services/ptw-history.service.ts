import { api } from '@/services/api';

function unwrap<T>(response: { data: { data: T } }) { return response.data.data; }

export type PermitHistoryFilters = { category?: string | undefined; event_type?: string | undefined; user_id?: string | undefined; date_from?: string | undefined; date_to?: string | undefined; search?: string | undefined; safety_critical?: boolean | undefined; page?: number | undefined; limit?: number | undefined };
export type PermitHistoryEvent = {
  id: string;
  event_category?: string | null;
  event_type: string;
  event_title?: string | null;
  title?: string | null;
  description?: string | null;
  user_id?: string | null;
  user_name?: string | null;
  user_role?: string | null;
  related_record_type?: string | null;
  related_record_id?: string | null;
  related_record_number?: string | null;
  before_value?: unknown;
  after_value?: unknown;
  before_data?: unknown;
  after_data?: unknown;
  metadata?: Record<string, unknown>;
  is_safety_critical?: boolean;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
};
export type PermitHistorySummary = { totalEvents: number; lastEvent?: string | null; lastUpdatedBy?: string | null; lastUpdatedAt?: string | null; permitAgeDays: number; currentStatus: string; lifecycleEvents: number; safetyCriticalEvents: number };

export const ptwHistoryService = {
  list: (permitId: string, filters?: PermitHistoryFilters) => api.get(`/ptw/${permitId}/history`, { params: filters }).then(unwrap<PermitHistoryEvent[]>),
  summary: (permitId: string) => api.get(`/ptw/${permitId}/history/summary`).then(unwrap<PermitHistorySummary>),
  detail: (permitId: string, eventId: string) => api.get(`/ptw/${permitId}/history/${eventId}`).then(unwrap<PermitHistoryEvent>),
  exportUrl: (permitId: string, kind: 'pdf' | 'csv') => `${api.defaults.baseURL}/ptw/${permitId}/history/export/${kind}`
};
