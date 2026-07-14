'use client';

import { useQuery } from '@tanstack/react-query';
import { mocWorkflowService } from '../services/moc-workflow.service';

export function useMOCWorkflow(id: string) {
  return useQuery({ queryKey: ['moc', id, 'workflow'], queryFn: () => mocWorkflowService.get(id), enabled: Boolean(id), refetchOnWindowFocus: false });
}
