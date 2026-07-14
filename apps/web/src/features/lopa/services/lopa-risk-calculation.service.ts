import { api } from '@/services/api';
import type { LopaRiskCalculationActionInput, LopaRiskCalculationAssumptionInput, LopaRiskCalculationData, LopaRiskCalculationFilters, LopaRiskCalculationGapInput } from '../types/lopa-risk-calculation.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const lopaRiskCalculationService = {
  get: (id: string, filters: LopaRiskCalculationFilters = {}) => api.get(`/lopa/${id}/risk-calculation`, { params: filters }).then(unwrap<LopaRiskCalculationData>),
  calculate: (id: string, values: LopaRiskCalculationActionInput) => api.post(`/lopa/${id}/risk-calculation/calculate`, values).then(unwrap<any>),
  recalculate: (id: string, values: LopaRiskCalculationActionInput) => api.post(`/lopa/${id}/risk-calculation/recalculate`, values).then(unwrap<any>),
  saveSnapshot: (id: string, values: LopaRiskCalculationActionInput) => api.post(`/lopa/${id}/risk-calculation/save-snapshot`, values).then(unwrap<any>),
  lock: (id: string, reason?: string) => api.post(`/lopa/${id}/risk-calculation/lock`, { reason }).then(unwrap<any>),
  unlock: (id: string, reason?: string) => api.post(`/lopa/${id}/risk-calculation/unlock`, { reason }).then(unwrap<any>),
  createAssumption: (id: string, values: LopaRiskCalculationAssumptionInput) => api.post(`/lopa/${id}/risk-calculation/assumptions`, values).then(unwrap<any>),
  updateAssumption: (id: string, assumptionId: string, values: LopaRiskCalculationAssumptionInput) => api.patch(`/lopa/${id}/risk-calculation/assumptions/${assumptionId}`, values).then(unwrap<any>),
  deleteAssumption: (id: string, assumptionId: string) => api.delete(`/lopa/${id}/risk-calculation/assumptions/${assumptionId}`).then(unwrap<any>),
  createGap: (id: string, values: LopaRiskCalculationGapInput) => api.post(`/lopa/${id}/risk-calculation/gaps`, values).then(unwrap<any>),
  createGapAction: (id: string, gapId: string) => api.post(`/lopa/${id}/risk-calculation/gaps/${gapId}/create-action`).then(unwrap<any>),
  createRiskGapAction: (id: string) => api.post(`/lopa/${id}/risk-calculation/create-risk-gap-action`).then(unwrap<any>),
  createMissingInputActions: (id: string) => api.post(`/lopa/${id}/risk-calculation/create-missing-input-actions`).then(unwrap<any>),
  export: (id: string, filters: LopaRiskCalculationFilters = {}) => api.get(`/lopa/${id}/risk-calculation/export`, { params: filters }).then(unwrap<any>)
};
