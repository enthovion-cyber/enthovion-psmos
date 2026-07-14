'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsService, type NotificationPreferenceInput } from '@/services/notifications.service';

export function useNotificationPreferences() {
  return useQuery({ queryKey: ['notification-preferences'], queryFn: () => notificationsService.preferences() });
}

export function useNotificationPreferenceMutations() {
  const queryClient = useQueryClient();
  return {
    update: useMutation({
      mutationFn: (preferences: NotificationPreferenceInput[]) => notificationsService.updatePreferences(preferences),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notification-preferences'] })
    })
  };
}
