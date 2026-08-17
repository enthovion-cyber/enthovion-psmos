import { useQuery } from '@tanstack/react-query';
import { safeguardSchedulerService } from '../services/safeguard-scheduler.service';

export function useSafeguardOccurrences(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['mechanical-integrity', 'safeguard-occurrences', filters], queryFn: () => safeguardSchedulerService.occurrences(filters) });
}
