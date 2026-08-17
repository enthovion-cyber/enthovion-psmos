import { get, patch, post } from './safeguard-api';

export const safeguardDemandService = {
  registry: (safeguardType: string, safeguardId: string, params: Record<string, unknown> = {}) => get<Record<string, any>>(`/mechanical-integrity/sis/${safeguardType}/${safeguardId}/demands`, params),
  create: (safeguardType: string, safeguardId: string, input: Record<string, unknown>) => post<Record<string, any>>(`/mechanical-integrity/sis/${safeguardType}/${safeguardId}/demands`, input),
  get: (safeguardType: string, safeguardId: string, demandId: string) => get<Record<string, any>>(`/mechanical-integrity/sis/${safeguardType}/${safeguardId}/demands/${demandId}`),
  update: (safeguardType: string, safeguardId: string, demandId: string, input: Record<string, unknown>) => patch<Record<string, any>>(`/mechanical-integrity/sis/${safeguardType}/${safeguardId}/demands/${demandId}`, input)
};
