import { useQuery } from '@tanstack/react-query';
import { requiredTrainingService } from '../services/required-training.service';

export function useRequiredTrainingLibrary(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['required-training', 'library', params], queryFn: () => requiredTrainingService.library(params) });
}

export function useRequiredTrainingLibrarySummary(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['required-training', 'library-summary', params], queryFn: () => requiredTrainingService.librarySummary(params) });
}
