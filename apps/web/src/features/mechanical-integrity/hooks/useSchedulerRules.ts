'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { schedulerRuleService } from '../services/scheduler-rule.service';

export function useSchedulerRules(params: Record<string, unknown> = {}) {
  const qc = useQueryClient();
  const rules = useQuery({ queryKey: ['mechanical-integrity', 'inspection-scheduler', 'rules', params], queryFn: () => schedulerRuleService.list(params) });
  const create = useMutation({ mutationFn: (input: Record<string, unknown>) => schedulerRuleService.create(input), onSuccess: () => qc.invalidateQueries({ queryKey: ['mechanical-integrity', 'inspection-scheduler', 'rules'] }) });
  return { rules, create };
}
