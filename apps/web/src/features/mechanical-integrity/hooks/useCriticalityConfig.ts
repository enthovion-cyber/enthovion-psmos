'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { criticalityConfigService } from '../services/criticality-config.service';

export function useCriticalityConfig() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['mechanical-integrity', 'criticality-config'], queryFn: () => criticalityConfigService.active() });
  const save = useMutation({ mutationFn: (input: Record<string, unknown>) => criticalityConfigService.save(input), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mechanical-integrity', 'criticality-config'] }) });
  return { ...query, save };
}
