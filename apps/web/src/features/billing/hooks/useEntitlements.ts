'use client';

import { useQuery } from '@tanstack/react-query';
import { entitlementService } from '../services/entitlement.service';

export function useEntitlements() {
  return useQuery({ queryKey: ['billing', 'entitlements'], queryFn: entitlementService.list });
}
