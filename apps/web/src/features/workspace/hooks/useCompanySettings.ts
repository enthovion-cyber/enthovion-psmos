'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { foundationService, type FoundationInput } from '@/services/foundation.service';

export function useCompanySettings() {
  return useQuery({ queryKey: ['workspace', 'company-settings'], queryFn: foundationService.companySettings });
}

export function useCompanySettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: FoundationInput) => foundationService.updateCompanySettings(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workspace'] });
      await queryClient.invalidateQueries({ queryKey: ['foundation'] });
    }
  });
}
