import { useQuery } from '@tanstack/react-query';
import { reliefScenarioService } from '../services/relief-scenario.service';

export function useReliefScenarios(reliefBasisId?: string | undefined) {
  return useQuery({ queryKey: ['psi', 'relief-scenarios', reliefBasisId], queryFn: () => reliefScenarioService.list(reliefBasisId as string), enabled: Boolean(reliefBasisId) });
}
