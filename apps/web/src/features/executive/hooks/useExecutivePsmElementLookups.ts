'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export function useExecutivePsmElementLookups(kind: string) {
  return useQuery({
    queryKey: ['executive', 'lookups', kind],
    queryFn: async () => {
      const res = await api.get(`/executive/lookups/${kind}`);
      return res.data?.data ?? res.data ?? [];
    },
    refetchOnWindowFocus: false,
  });
}
