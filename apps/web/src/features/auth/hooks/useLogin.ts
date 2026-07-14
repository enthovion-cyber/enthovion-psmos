'use client';

import { useMutation } from '@tanstack/react-query';
import { authFeatureService } from '../services/auth.service';

export function useLogin() {
  return useMutation({ mutationFn: authFeatureService.login });
}
