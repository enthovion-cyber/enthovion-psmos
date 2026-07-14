'use client';

import { useMutation } from '@tanstack/react-query';
import { signupService } from '../services/signup.service';

export function useSignup() {
  return useMutation({ mutationFn: signupService.email });
}

export function useResendVerification() {
  return useMutation({ mutationFn: signupService.resendVerification });
}

export function useCompleteSignup() {
  return useMutation({ mutationFn: signupService.completeWorkspace });
}

export function useStartTrial() {
  return useMutation({ mutationFn: signupService.startTrial });
}

export function useStartCheckout() {
  return useMutation({ mutationFn: signupService.startCheckout });
}
