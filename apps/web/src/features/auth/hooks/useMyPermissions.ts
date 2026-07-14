'use client';

import { useQuery } from '@tanstack/react-query';
import { permissionService } from '../services/permission.service';

export function useMyPermissions() {
  return useQuery({ queryKey: ['iam', 'me', 'permissions'], queryFn: () => permissionService.myPermissions(), staleTime: 60_000 });
}
