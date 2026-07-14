'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { workspaceSelectionService } from '../services/workspace-selection.service';

export function useWorkspaceSelection() {
  return useQuery({ queryKey: ['auth', 'workspaces'], queryFn: workspaceSelectionService.workspaces });
}

export function useSelectWorkspace() {
  return useMutation({ mutationFn: (companyId: string) => workspaceSelectionService.selectWorkspace(companyId) });
}
