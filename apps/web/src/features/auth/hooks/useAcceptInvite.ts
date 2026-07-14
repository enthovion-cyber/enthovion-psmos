'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { invitationAuthService } from '../services/invitation-auth.service';

export function useInviteSummary(token: string) {
  return useQuery({ queryKey: ['auth', 'invite', token], queryFn: () => invitationAuthService.summary(token), enabled: Boolean(token) });
}

export function useAcceptInvite(token: string) {
  return useMutation({ mutationFn: (input: { displayName: string; password: string }) => invitationAuthService.accept(token, input) });
}
