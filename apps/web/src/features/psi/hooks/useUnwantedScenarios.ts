import { useQuery } from '@tanstack/react-query';
import { unwantedScenarioService } from '../services/unwanted-scenario.service';

export function useUnwantedScenarios(chemistryId: string) {
  return useQuery({ queryKey: ['psi', 'process-chemistry-scenarios', chemistryId], queryFn: () => unwantedScenarioService.list(chemistryId), enabled: Boolean(chemistryId) });
}
