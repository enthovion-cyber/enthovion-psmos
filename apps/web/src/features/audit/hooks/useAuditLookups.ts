import { useQuery } from '@tanstack/react-query';
import { auditLookupsService } from '../services/audit-lookups.service';
import { auditProgramService } from '../services/audit-program.service';

export function useAuditLookups() {
  return useQuery({ queryKey: ['audit', 'lookups'], queryFn: auditLookupsService.all });
}

export function useAuditContext() {
  return useQuery({ queryKey: ['audit', 'context'], queryFn: auditProgramService.context });
}
