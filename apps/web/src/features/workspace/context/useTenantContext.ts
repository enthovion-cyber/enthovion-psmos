'use client';

import { useQuery } from '@tanstack/react-query';
import { tenantContextService } from '../services/tenant-context.service';

export function useTenantContext() {
  return useQuery({ queryKey: ['workspace', 'tenant-context'], queryFn: () => tenantContextService.get(), staleTime: 30_000 });
}
