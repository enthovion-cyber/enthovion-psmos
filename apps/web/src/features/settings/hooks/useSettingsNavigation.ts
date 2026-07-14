'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsNavigationService } from '../services/settings-navigation.service';

export function useSettingsNavigation() {
  return useQuery({ queryKey: ['settings', 'navigation'], queryFn: settingsNavigationService.navigation, staleTime: 60_000 });
}

export function useGeneralSettings() {
  return useQuery({ queryKey: ['settings', 'general'], queryFn: settingsNavigationService.general });
}

export function useSaveGeneralSettings() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: settingsNavigationService.saveGeneral, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings', 'general'] }) });
}
