'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { searchService, type SearchParams } from '@/services/search.service';

export function useGlobalSearch(params: SearchParams, enabled = true) {
  return useQuery({
    queryKey: ['search', params],
    queryFn: () => searchService.search(params),
    enabled
  });
}

export function useRecentSearches() {
  return useQuery({ queryKey: ['search', 'recent'], queryFn: searchService.recent });
}

export function useSearchMutations() {
  const queryClient = useQueryClient();
  return {
    addHistory: useMutation({
      mutationFn: searchService.addHistory,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['search', 'recent'] })
    }),
    clearRecent: useMutation({
      mutationFn: searchService.clearRecent,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['search', 'recent'] })
    }),
    reindex: useMutation({
      mutationFn: searchService.reindex,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['search'] })
    })
  };
}
