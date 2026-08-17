import { useQuery } from '@tanstack/react-query';
import { regulatoryActionService } from '../services/regulatory-action.service';

export function useRegulatoryActions(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'actions', 'register', filters], queryFn: () => regulatoryActionService.register(filters), refetchOnWindowFocus: false });
}

export function useRegulatoryActionSource(sourcePath: string, filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'actions', 'source', sourcePath, filters], queryFn: () => regulatoryActionService.source(sourcePath, filters), enabled: Boolean(sourcePath), refetchOnWindowFocus: false });
}
