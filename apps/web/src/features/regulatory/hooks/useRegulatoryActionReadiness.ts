import { useQuery } from '@tanstack/react-query';
import { regulatoryActionService } from '../services/regulatory-action.service';

export function useRegulatoryActionReadiness(sourcePath: string, filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'actions', 'readiness', sourcePath, filters], queryFn: () => regulatoryActionService.sourceReadiness(sourcePath, filters), enabled: Boolean(sourcePath), refetchOnWindowFocus: false });
}
