import { useQuery } from '@tanstack/react-query'; import { auditPlanService } from '../services/audit-plan.service';
export function useAuditPlanReadiness(id: string) { return useQuery({ queryKey: ['audit','plans',id,'readiness'], queryFn: () => auditPlanService.readiness(id), enabled: Boolean(id) }); }
