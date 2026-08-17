import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { competencyLibraryService } from '../services/competency-library.service';

export function useCompetencyLibrary(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['competency-library', params], queryFn: () => competencyLibraryService.list(params) });
}

export function useCompetencyDetail(competencyId?: string) {
  return useQuery({ queryKey: ['competency-library-detail', competencyId], queryFn: () => competencyLibraryService.detail(competencyId!), enabled: Boolean(competencyId) });
}

export function useCompetencyLibraryMutations(competencyId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => competencyId ? competencyLibraryService.update(competencyId, payload) : competencyLibraryService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['competency-library'] });
      void queryClient.invalidateQueries({ queryKey: ['competency-library-detail', competencyId] });
    }
  });
}
