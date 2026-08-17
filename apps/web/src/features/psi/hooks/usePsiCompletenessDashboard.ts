import { useQuery } from '@tanstack/react-query';
import { psiCompletenessService } from '../services/psi-completeness.service';

export function usePsiCompletenessDashboard(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['psi', 'completeness', 'dashboard', filters], queryFn: () => psiCompletenessService.dashboard(filters) });
}
