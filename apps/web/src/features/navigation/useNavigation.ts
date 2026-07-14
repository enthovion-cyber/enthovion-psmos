'use client';

import { useQuery } from '@tanstack/react-query';
import { navigationService } from './navigation.service';

export function useNavigation() {
  return useQuery({ queryKey: ['iam', 'me', 'navigation'], queryFn: () => navigationService.navigation(), staleTime: 60_000 });
}
