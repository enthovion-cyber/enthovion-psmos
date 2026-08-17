import { useQuery } from '@tanstack/react-query'; import { auditPlanService } from '../services/audit-plan.service';
export function useAuditPlanConflicts(id: string) { return useQuery({ queryKey: ['audit','plans',id,'conflicts'], queryFn: () => auditPlanService.conflicts(id), enabled: Boolean(id) }); }
