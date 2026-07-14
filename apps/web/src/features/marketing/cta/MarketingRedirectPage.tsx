'use client';

import { useEffect } from 'react';
import type { MarketingCtaAction } from '../types/marketing.types';
import { useMarketingCta } from '../hooks/useMarketingCta';

export function MarketingRedirectPage({ action, planCode }: { action: MarketingCtaAction; planCode?: string | undefined }) {
  const cta = useMarketingCta();
  useEffect(() => {
    if (cta.isLoading) return;
    cta.go(action, planCode);
  }, [action, planCode, cta.isLoading]);
  return (
    <main className="grid min-h-[60vh] place-items-center px-4">
      <div className="rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 text-center shadow-[var(--psm-shadow-soft)]">
        <div className="text-lg font-black">Preparing your next step...</div>
        <p className="mt-2 text-sm text-[var(--psm-muted)]">Your selected intent and plan are being preserved.</p>
      </div>
    </main>
  );
}
