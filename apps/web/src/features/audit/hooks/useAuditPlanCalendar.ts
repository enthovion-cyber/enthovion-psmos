import { useQuery } from '@tanstack/react-query'; import { auditPlanService } from '../services/audit-plan.service';
export function useAuditPlanCalendar(filters: Record<string, unknown> = {}) { return useQuery({ queryKey: ['audit','plans','calendar',filters], queryFn: () => auditPlanService.calendar(filters) }); }
