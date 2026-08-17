import { get, post } from './safeguard-api';

export const safeguardSchedulerService = {
  due: (params: Record<string, unknown> = {}) => get<Record<string, any>>('/mechanical-integrity/sis/due', params),
  overdue: (params: Record<string, unknown> = {}) => get<Record<string, any>>('/mechanical-integrity/sis/overdue', params),
  occurrences: (params: Record<string, unknown> = {}) => get<Record<string, any>>('/mechanical-integrity/safeguard-tests/occurrences', params),
  run: () => post<Record<string, any>>('/mechanical-integrity/safeguard-tests/scheduler/run', {}),
  createTest: (occurrenceId: string, input: Record<string, unknown> = {}) => post<Record<string, any>>(`/mechanical-integrity/safeguard-tests/occurrences/${occurrenceId}/create-test`, input),
  complete: (occurrenceId: string, input: Record<string, unknown> = {}) => post<Record<string, any>>(`/mechanical-integrity/safeguard-tests/occurrences/${occurrenceId}/complete`, input)
};
