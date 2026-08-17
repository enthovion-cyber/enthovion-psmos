import { api } from '@/services/api';
import type { MiInspectionSchedulerRule } from '../types/scheduler-rule.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const schedulerRuleService = {
  list(params: Record<string, unknown> = {}): Promise<MiInspectionSchedulerRule[]> {
    return api.get('/mechanical-integrity/inspection-scheduler/rules', { params }).then(unwrap<MiInspectionSchedulerRule[]>);
  },
  create(input: Record<string, unknown>): Promise<MiInspectionSchedulerRule> {
    return api.post('/mechanical-integrity/inspection-scheduler/rules', input).then(unwrap<MiInspectionSchedulerRule>);
  },
  update(ruleId: string, input: Record<string, unknown>): Promise<MiInspectionSchedulerRule> {
    return api.patch(`/mechanical-integrity/inspection-scheduler/rules/${ruleId}`, input).then(unwrap<MiInspectionSchedulerRule>);
  },
  archive(ruleId: string): Promise<MiInspectionSchedulerRule> {
    return api.post(`/mechanical-integrity/inspection-scheduler/rules/${ruleId}/archive`).then(unwrap<MiInspectionSchedulerRule>);
  }
};
