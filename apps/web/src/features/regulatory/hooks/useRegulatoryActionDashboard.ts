import { useQuery } from '@tanstack/react-query';
import { regulatoryActionService } from '../services/regulatory-action.service';

export function useRegulatoryActionDashboard(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'actions', 'dashboard', filters], queryFn: () => regulatoryActionService.dashboard(filters), refetchOnWindowFocus: false });
}
