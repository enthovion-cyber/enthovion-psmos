import { useQuery } from '@tanstack/react-query'; import { auditPlanService } from '../services/audit-plan.service';
export function useAuditPlanDetail(id: string) { return useQuery({ queryKey: ['audit','plans',id], queryFn: () => auditPlanService.detail(id), enabled: Boolean(id) }); }
