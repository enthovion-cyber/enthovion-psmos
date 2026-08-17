import { useQuery } from '@tanstack/react-query';
import { auditProgramService } from '../services/audit-program.service';

export function useAuditPrograms(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['audit', 'programs', filters], queryFn: () => auditProgramService.register(filters) });
}
