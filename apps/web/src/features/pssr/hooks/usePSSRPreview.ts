'use client';

import { useQuery } from '@tanstack/react-query';
import { pssrService } from '../services/pssr.service';

export function usePSSRPreview(id?: string) {
  return useQuery({
    queryKey: ['pssr', 'preview', id],
    queryFn: () => pssrService.preview(id as string),
    enabled: Boolean(id),
    refetchOnWindowFocus: false
  });
}
