import { useMutation, useQueryClient } from '@tanstack/react-query';
import { miReportService } from '../services/mi-report.service';

export function useReportGeneration() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: miReportService.generate, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mechanical-integrity', 'reports'] }) });
}
