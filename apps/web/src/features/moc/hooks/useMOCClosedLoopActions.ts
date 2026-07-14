'use client';

import { useQuery } from '@tanstack/react-query';
import { mocActionsService } from '../services/moc-actions.service';

export function useMOCClosedLoopActions(id: string) {
  return useQuery({
    queryKey: ['moc', id, 'closed-loop-actions'],
    queryFn: async () => {
      const [actions, summary, startupBlockers, closureBlockers, closureChecklist, links] = await Promise.all([
        mocActionsService.list(id),
        mocActionsService.summary(id),
        mocActionsService.startupBlockers(id),
        mocActionsService.closureBlockers(id),
        mocActionsService.closureChecklist(id),
        mocActionsService.links(id)
      ]);
      return { actions, summary, startupBlockers, closureBlockers, closureChecklist, links };
    },
    enabled: Boolean(id),
    refetchOnWindowFocus: false
  });
}
