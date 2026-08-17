import type { MiWorkOrderRegistryResponse } from '../types/work-order.types';
import { get, post } from './safeguard-api';

export const miActionService = {
  registry: (params: Record<string, unknown> = {}) => get<MiWorkOrderRegistryResponse>('/mechanical-integrity/actions', params),
  myActions: (params: Record<string, unknown> = {}) => get<MiWorkOrderRegistryResponse>('/mechanical-integrity/actions/my-actions', params),
  overdue: (params: Record<string, unknown> = {}) => get<MiWorkOrderRegistryResponse>('/mechanical-integrity/actions/overdue', params),
  create: (input: Record<string, unknown>) => post('/mechanical-integrity/actions', input)
};
