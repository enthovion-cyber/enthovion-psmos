import { get } from '@/features/audit/services/audit-api';
import type { RegulatoryHistoryEvent } from '../types/regulatory.types';

export const regulatoryHistoryService = {
  list: (params?: Record<string, unknown>) => get<{ rows: RegulatoryHistoryEvent[]; summary?: Record<string, unknown> }>('/regulatory/history', params),
  item: (id: string) => get<{ rows: RegulatoryHistoryEvent[] }>(`/regulatory/${id}/history`)
};
