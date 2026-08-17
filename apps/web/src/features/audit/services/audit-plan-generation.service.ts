import { post } from './audit-api';
export const auditPlanGenerationService = { generate: (payload: Record<string, unknown>) => post<Record<string, any>>('/audit-compliance/plans/generate-from-program', payload) };
