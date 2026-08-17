import { useQuery } from '@tanstack/react-query';
import { miActionService } from '../services/mi-action.service';

export function useMiActions(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['mechanical-integrity', 'actions', filters], queryFn: () => miActionService.registry(filters) });
}
