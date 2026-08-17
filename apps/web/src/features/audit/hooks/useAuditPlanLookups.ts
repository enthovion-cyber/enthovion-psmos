import { useQuery } from '@tanstack/react-query'; import { auditPlanService } from '../services/audit-plan.service';
export function useAuditPlanLookups() { return useQuery({ queryKey: ['audit','plans','lookups'], queryFn: auditPlanService.lookups, staleTime: 300000 }); }
