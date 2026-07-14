'use client';

import { useMutation } from '@tanstack/react-query';
import { authFeatureService } from '../services/auth.service';

export function useLogout() {
  return useMutation({ mutationFn: authFeatureService.logout });
}
