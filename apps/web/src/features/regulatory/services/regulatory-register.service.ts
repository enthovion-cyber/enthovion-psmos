import { get } from '@/features/audit/services/audit-api';
import type { RegulatoryRegister } from '../types/regulatory.types';

export const regulatoryRegisterService = {
  register: (params?: Record<string, unknown>) => get<RegulatoryRegister>('/regulatory/register', params),
  filtered: (view: string, params?: Record<string, unknown>) => get<RegulatoryRegister>(`/regulatory/${view}`, params),
  scoped: (kind: 'sites' | 'units' | 'areas' | 'equipment', id: string, params?: Record<string, unknown>) => get<RegulatoryRegister>(`/regulatory/${kind}/${id}`, params)
};
