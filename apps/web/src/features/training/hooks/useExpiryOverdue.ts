import { useQuery } from '@tanstack/react-query';
import { expiryOverdueService } from '../services/expiry-overdue.service';

export function useExpiryOverdue(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'expiry-overdue', filters], queryFn: () => expiryOverdueService.view(filters) });
}
