'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { authFeatureService } from '../services/auth.service';

export function useAuthSession() {
  return useQuery({ queryKey: ['auth', 'session'], queryFn: () => authFeatureService.session(), retry: false });
}

export function useRefreshAuthSession() {
  return useMutation({ mutationFn: () => authFeatureService.refreshSession() });
}
