import { api } from '@/services/api';
import type { MiInspectionPlanDetail, MiInspectionPlanRegistryResponse, MiInspectionPlanSummary } from '../types/inspection-plan.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const inspectionPlanService = {
  registry(params: Record<string, unknown> = {}): Promise<MiInspectionPlanRegistryResponse> {
    return api.get('/mechanical-integrity/inspection-plans', { params }).then(unwrap<MiInspectionPlanRegistryResponse>);
  },
  equipmentRegistry(equipmentId: string, params: Record<string, unknown> = {}): Promise<MiInspectionPlanRegistryResponse> {
    return api.get(`/mechanical-integrity/equipment/${equipmentId}/inspection-plans`, { params }).then(unwrap<MiInspectionPlanRegistryResponse>);
  },
  summary(params: Record<string, unknown> = {}): Promise<MiInspectionPlanSummary> {
    return api.get('/mechanical-integrity/inspection-plans/summary', { params }).then(unwrap<MiInspectionPlanSummary>);
  },
  equipmentSummary(equipmentId: string): Promise<Record<string, unknown>> {
    return api.get(`/mechanical-integrity/equipment/${equipmentId}/inspection-plan-summary`).then(unwrap<Record<string, unknown>>);
  },
  get(planId: string): Promise<MiInspectionPlanDetail> {
    return api.get(`/mechanical-integrity/inspection-plans/${planId}`).then(unwrap<MiInspectionPlanDetail>);
  },
  create(input: Record<string, unknown>, equipmentId?: string): Promise<MiInspectionPlanDetail> {
    const url = equipmentId ? `/mechanical-integrity/equipment/${equipmentId}/inspection-plans` : '/mechanical-integrity/inspection-plans';
    return api.post(url, input).then(unwrap<MiInspectionPlanDetail>);
  },
  update(planId: string, input: Record<string, unknown>): Promise<MiInspectionPlanDetail> {
    return api.patch(`/mechanical-integrity/inspection-plans/${planId}`, input).then(unwrap<MiInspectionPlanDetail>);
  },
  submit(planId: string, comment?: string): Promise<MiInspectionPlanDetail> {
    return api.post(`/mechanical-integrity/inspection-plans/${planId}/submit`, { comment }).then(unwrap<MiInspectionPlanDetail>);
  },
  approve(planId: string, comment?: string): Promise<MiInspectionPlanDetail> {
    return api.post(`/mechanical-integrity/inspection-plans/${planId}/approve`, { comment }).then(unwrap<MiInspectionPlanDetail>);
  },
  reject(planId: string, reason: string): Promise<MiInspectionPlanDetail> {
    return api.post(`/mechanical-integrity/inspection-plans/${planId}/reject`, { reason }).then(unwrap<MiInspectionPlanDetail>);
  },
  createRevision(planId: string, reason: string): Promise<MiInspectionPlanDetail> {
    return api.post(`/mechanical-integrity/inspection-plans/${planId}/create-revision`, { reason }).then(unwrap<MiInspectionPlanDetail>);
  },
  archive(planId: string, reason: string): Promise<MiInspectionPlanDetail> {
    return api.post(`/mechanical-integrity/inspection-plans/${planId}/archive`, { reason }).then(unwrap<MiInspectionPlanDetail>);
  }
};
