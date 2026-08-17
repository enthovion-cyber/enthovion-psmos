import { useQuery } from '@tanstack/react-query';
import { reliefTestService } from '../services/relief-test.service';

export function useReliefTests(filters: Record<string, unknown> = {}, equipmentId?: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'relief-tests', equipmentId ?? 'all', filters], queryFn: () => reliefTestService.registry(filters, equipmentId) });
}

export function useReliefTest(testId?: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'relief-test', testId], queryFn: () => reliefTestService.get(testId!), enabled: !!testId });
}
