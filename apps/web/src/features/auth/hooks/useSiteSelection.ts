'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { workspaceSelectionService } from '../services/workspace-selection.service';

export function useSiteSelection() {
  return useQuery({ queryKey: ['auth', 'sites'], queryFn: workspaceSelectionService.sites });
}

export function useSelectSite() {
  return useMutation({ mutationFn: (siteId: string | null) => workspaceSelectionService.selectSite(siteId) });
}
