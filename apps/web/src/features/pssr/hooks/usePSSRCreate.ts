import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pssrService } from '../services/pssr.service';
import type { PSSRCreateValues } from '../schemas/pssr-create.schema';

export function usePSSRContext(mocId?: string | null) {
  const context = useQuery({ queryKey: ['pssr', 'new', 'context'], queryFn: pssrService.context, refetchOnWindowFocus: false });
  const mocContext = useQuery({ queryKey: ['pssr', 'new', 'moc-context', mocId], queryFn: () => pssrService.fromMocContext(mocId as string), enabled: Boolean(mocId), refetchOnWindowFocus: false });
  return { context, mocContext };
}

export function usePSSRCreate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: PSSRCreateValues) => pssrService.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pssr'] });
      queryClient.invalidateQueries({ queryKey: ['moc'] });
    }
  });
}
