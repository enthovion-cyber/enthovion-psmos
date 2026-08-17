import { useQuery } from '@tanstack/react-query'; import { auditPlanService } from '../services/audit-plan.service';
export function useAuditPlanDashboard(filters: Record<string, unknown> = {}) { return useQuery({ queryKey: ['audit','plans','dashboard',filters], queryFn: () => auditPlanService.dashboard(filters) }); }
