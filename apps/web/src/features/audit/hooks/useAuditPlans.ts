import { useQuery } from '@tanstack/react-query'; import { auditPlanService } from '../services/audit-plan.service';
export function useAuditPlans(filters: Record<string, unknown> = {}) { return useQuery({ queryKey: ['audit','plans',filters], queryFn: () => auditPlanService.register(filters) }); }
