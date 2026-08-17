import { get, post } from './audit-api';
export const auditPlanReadinessService = { get: (id: string) => get<Record<string, any>>(`/audit-compliance/plans/${id}/readiness`), run: (id: string) => post<Record<string, any>>(`/audit-compliance/plans/${id}/readiness/run`) };
