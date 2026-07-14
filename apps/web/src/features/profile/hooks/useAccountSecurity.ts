'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountSecurityService } from '../services/account-security.service';
import type { ProfileNotificationPreferences } from '../types/account-security.types';

export function useProfileAccount() {
  return useQuery({ queryKey: ['profile', 'account'], queryFn: accountSecurityService.account, staleTime: 60_000 });
}

export function useProfileSecurity() {
  return useQuery({ queryKey: ['profile', 'security'], queryFn: accountSecurityService.security, staleTime: 60_000 });
}

export function useProfileSessions() {
  return useQuery({ queryKey: ['profile', 'sessions'], queryFn: accountSecurityService.sessions, staleTime: 60_000 });
}

export function useRevokeProfileSession() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: accountSecurityService.revokeSession, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile', 'sessions'] }) });
}

export function useProfileNotifications() {
  return useQuery({ queryKey: ['profile', 'notifications'], queryFn: accountSecurityService.notifications, staleTime: 60_000 });
}

export function useSaveProfileNotifications() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (input: ProfileNotificationPreferences) => accountSecurityService.saveNotifications(input), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile', 'notifications'] }) });
}

export function useDangerZoneRequests() {
  return useQuery({ queryKey: ['profile', 'danger-zone', 'requests'], queryFn: accountSecurityService.dangerRequests, staleTime: 60_000 });
}

export function useDangerZoneMutations() {
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: ['profile', 'danger-zone', 'requests'] });
  return {
    requestDelete: useMutation({ mutationFn: accountSecurityService.requestDelete, onSuccess }),
    requestDeactivate: useMutation({ mutationFn: accountSecurityService.requestDeactivate, onSuccess })
  };
}
