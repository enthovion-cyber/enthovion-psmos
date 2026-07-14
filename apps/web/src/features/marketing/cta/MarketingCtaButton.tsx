'use client';

import { ArrowRight } from 'lucide-react';
import type { MarketingCtaAction } from '../types/marketing.types';
import { useMarketingCta } from '../hooks/useMarketingCta';

export function MarketingCtaButton({ action, planCode, children, variant = 'primary', className = '' }: { action: MarketingCtaAction; planCode?: string | undefined; children: React.ReactNode; variant?: 'primary' | 'secondary' | 'ghost'; className?: string | undefined }) {
  const cta = useMarketingCta();
  const styles = variant === 'primary'
    ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/20 hover:bg-blue-500'
    : variant === 'secondary'
    ? 'border border-[color-mix(in_srgb,var(--psm-line)_70%,transparent)] bg-[color-mix(in_srgb,var(--psm-surface)_78%,transparent)] text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)]'
    : 'text-[var(--psm-muted)] hover:text-[var(--psm-text)]';
  return (
    <button type="button" onClick={() => cta.go(action, planCode)} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition hover:-translate-y-0.5 ${styles} ${className}`}>
      {children} <ArrowRight size={16} />
    </button>
  );
}
