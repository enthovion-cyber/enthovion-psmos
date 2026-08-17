import { get } from './audit-api';
export const auditPlanCalendarService = { load: (params?: Record<string, unknown>) => get<Record<string, any>>('/audit-compliance/plans/calendar', params) };
