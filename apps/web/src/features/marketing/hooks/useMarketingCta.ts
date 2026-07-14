'use client';

import { useRouter } from 'next/navigation';
import type { MarketingCtaAction } from '../types/marketing.types';
import { marketingCtaService } from '../services/marketing-cta.service';
import { useMarketingAuthState } from './useMarketingAuthState';

export function useMarketingCta() {
  const router = useRouter();
  const auth = useMarketingAuthState();
  function go(action: MarketingCtaAction, planCode?: string | undefined) {
    const href = marketingCtaService.resolve(action, planCode, auth.isAuthenticated, auth.hasWorkspace);
    router.push(href);
  }
  return { ...auth, go };
}
