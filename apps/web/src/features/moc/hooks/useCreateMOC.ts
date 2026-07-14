import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mocService } from '../services/moc.service';
import type { MOCCreateValues } from '../schemas/moc.schema';

export function useCreateMOC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ values, submit }: { values: MOCCreateValues; submit: boolean }) => mocService.create(values, submit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moc'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['actions'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
    }
  });
}
