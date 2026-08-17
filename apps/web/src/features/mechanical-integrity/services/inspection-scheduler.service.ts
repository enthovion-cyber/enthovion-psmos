import { api } from '@/services/api';
import type { MiInspectionScheduleEvaluation } from '../types/inspection-scheduler.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const inspectionSchedulerService = {
  preview(planId: string): Promise<MiInspectionScheduleEvaluation> {
    return api.post(`/mechanical-integrity/inspection-plans/${planId}/schedule/preview`).then(unwrap<MiInspectionScheduleEvaluation>);
  },
  recalculate(planId: string): Promise<MiInspectionScheduleEvaluation> {
    return api.post(`/mechanical-integrity/inspection-plans/${planId}/schedule/recalculate`).then(unwrap<MiInspectionScheduleEvaluation>);
  },
  manualOverride(planId: string, input: Record<string, unknown>): Promise<MiInspectionScheduleEvaluation> {
    return api.post(`/mechanical-integrity/inspection-plans/${planId}/schedule/manual-override`, input).then(unwrap<MiInspectionScheduleEvaluation>);
  },
  evaluations(planId: string): Promise<MiInspectionScheduleEvaluation[]> {
    return api.get(`/mechanical-integrity/inspection-plans/${planId}/schedule/evaluations`).then(unwrap<MiInspectionScheduleEvaluation[]>);
  },
  run(input: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    return api.post('/mechanical-integrity/inspection-scheduler/run', input).then(unwrap<Record<string, unknown>>);
  },
  runs(): Promise<Array<Record<string, unknown>>> {
    return api.get('/mechanical-integrity/inspection-scheduler/runs').then(unwrap<Array<Record<string, unknown>>>);
  },
  equipmentSchedule(equipmentId: string): Promise<Record<string, unknown>> {
    return api.get(`/mechanical-integrity/equipment/${equipmentId}/inspection-schedule`).then(unwrap<Record<string, unknown>>);
  }
};
