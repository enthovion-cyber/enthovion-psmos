import { useQuery } from '@tanstack/react-query';
import { auditProgramService } from '../services/audit-program.service';

export function useAuditProgramDetail(programId: string) {
  return useQuery({ queryKey: ['audit', 'program', programId], queryFn: () => auditProgramService.detail(programId), enabled: Boolean(programId) });
}
