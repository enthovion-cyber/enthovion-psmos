'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { iamService } from '@/services/iam.service';

export function useMarketingAuthState() {
  const [hasToken, setHasToken] = useState(false);
  const [storedTenantId, setStoredTenantId] = useState<string | null>(null);

  useEffect(() => {
    setHasToken(Boolean(window.localStorage.getItem('psm.accessToken')));
    setStoredTenantId(window.localStorage.getItem('psm.tenantId'));
  }, []);

  const me = useQuery({ queryKey: ['marketing', 'me'], queryFn: () => iamService.me(), enabled: hasToken, retry: false });
  const user = hasToken && !me.isError ? me.data : null;
  const hasWorkspace = Boolean((user as any)?.userSites?.length || (user as any)?.tenant || storedTenantId);

  return {
    isAuthenticated: Boolean(hasToken && user),
    hasWorkspace,
    isLoading: hasToken && me.isLoading,
    user
  };
}
