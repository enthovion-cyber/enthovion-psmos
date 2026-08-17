import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { miExportService } from '../services/mi-export.service';

export function useMiExports(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['mechanical-integrity', 'exports', params], queryFn: () => miExportService.center(params) });
}

export function useMiExportLookups() {
  return useQuery({ queryKey: ['mechanical-integrity', 'export-lookups'], queryFn: miExportService.lookups });
}

export function useMiExportMutations() {
  const queryClient = useQueryClient();
  return {
    createJob: useMutation({ mutationFn: miExportService.createJob, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mechanical-integrity', 'exports'] }) }),
    cancelJob: useMutation({ mutationFn: miExportService.cancelJob, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mechanical-integrity', 'exports'] }) })
  };
}
