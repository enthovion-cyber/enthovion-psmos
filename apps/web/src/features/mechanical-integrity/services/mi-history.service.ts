import { get } from './safeguard-api';
import type { MiEquipmentHistory, MiHistoryDashboard, MiHistoryEvent } from '../types/mi-history.types';

export const miHistoryService = {
  dashboard: (params: Record<string, unknown> = {}) => get<MiHistoryDashboard>('/mechanical-integrity/history', params),
  summary: (params: Record<string, unknown> = {}) => get<Record<string, number>>('/mechanical-integrity/history/summary', params),
  timeline: (params: Record<string, unknown> = {}) => get<{ groups: Record<string, MiHistoryEvent[]>; rows: MiHistoryEvent[]; groupBy: string; lastUpdated: string }>('/mechanical-integrity/history/timeline', params),
  auditTrail: (params: Record<string, unknown> = {}) => get<MiHistoryDashboard>('/mechanical-integrity/history/audit-trail', params),
  changes: (params: Record<string, unknown> = {}) => get<MiHistoryDashboard>('/mechanical-integrity/history/changes', params),
  event: (eventId: string) => get<{ event: MiHistoryEvent; beforeAfter: { before: unknown; after: unknown }; auditMetadata: Record<string, unknown> }>(`/mechanical-integrity/history/events/${eventId}`),
  equipmentHistory: (equipmentId: string, params: Record<string, unknown> = {}) => get<MiEquipmentHistory>(`/mechanical-integrity/equipment/${equipmentId}/history`, params),
  lookups: () => Promise.all([
    get<string[]>('/mechanical-integrity/lookups/history-event-types')
  ]).then(([historyEventTypes]) => ({ historyEventTypes }))
};
