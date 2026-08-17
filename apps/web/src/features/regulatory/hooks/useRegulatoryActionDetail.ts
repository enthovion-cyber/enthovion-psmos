import { useQuery } from '@tanstack/react-query';
import { regulatoryActionService } from '../services/regulatory-action.service';

export function useRegulatoryActionDetail(actionLinkId: string) {
  return useQuery({ queryKey: ['regulatory', 'actions', 'detail', actionLinkId], queryFn: () => regulatoryActionService.detail(actionLinkId), enabled: Boolean(actionLinkId), refetchOnWindowFocus: false });
}

export function useRegulatoryActionSection(actionLinkId: string, section: string) {
  return useQuery({ queryKey: ['regulatory', 'actions', 'detail', actionLinkId, section], queryFn: () => regulatoryActionService.section(actionLinkId, section), enabled: Boolean(actionLinkId && section), refetchOnWindowFocus: false });
}
