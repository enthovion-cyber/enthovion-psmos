import { useQuery } from '@tanstack/react-query';
import { psiCompletenessService } from '../services/psi-completeness.service';

const filtered = {
  critical: psiCompletenessService.criticalGaps,
  pssr: psiCompletenessService.pssrBlockers,
  moc: psiCompletenessService.mocRequired,
  review: psiCompletenessService.reviewOverdue,
  document: psiCompletenessService.documentGaps,
  conflicts: psiCompletenessService.conflicts
};

export function usePsiGaps(filters: Record<string, unknown> = {}, mode?: keyof typeof filtered) {
  const queryFn = mode ? filtered[mode] : psiCompletenessService.gaps;
  return useQuery({ queryKey: ['psi', 'completeness', 'gaps', mode ?? 'all', filters], queryFn: () => queryFn(filters) });
}
