'use client';

import { ArrowRight } from 'lucide-react';
import type { MarketingCtaAction } from '../types/marketing.types';
import { useMarketingCta } from '../hooks/useMarketingCta';

export function MarketingCtaButton({
  action,
  planCode,
  children,
  variant = 'primary',
  className = ''
}: {
  action: MarketingCtaAction;
  planCode?: string | undefined;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string | undefined;
}) {
  const cta = useMarketingCta();
  const styles =
    variant === 'primary'
      ? 'bg-[var(--action-primary)] text-white shadow-md shadow-[var(--action-primary)]/20 hover:bg-[var(--action-primary-hover)] active:bg-[var(--action-primary-active)]'
      : variant === 'secondary'
      ? 'border border-[var(--psm-line)] bg-[var(--psm-surface)] text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)] hover:border-[var(--psm-primary)]'
      : 'text-[var(--psm-muted)] hover:text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)]';

  return (
    <button
      type="button"
      onClick={() => cta.go(action, planCode)}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${styles} ${className}`}
    >
      <span>{children}</span>
      <ArrowRight size={15} />
    </button>
  );
}
