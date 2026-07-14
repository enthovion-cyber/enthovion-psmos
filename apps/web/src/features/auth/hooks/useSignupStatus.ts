'use client';

import { useQuery } from '@tanstack/react-query';
import { signupService } from '../services/signup.service';

export function useSignupStatus(input: { sessionId?: string; email?: string }, enabled = true) {
  return useQuery({
    queryKey: ['signup-status', input.sessionId ?? '', input.email ?? ''],
    queryFn: () => signupService.status(input),
    enabled: enabled && Boolean(input.sessionId || input.email)
  });
}

export function useSignupPlans() {
  return useQuery({ queryKey: ['signup-plans'], queryFn: signupService.plans });
}
