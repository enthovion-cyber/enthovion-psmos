'use client';

import { MarketingFooter } from './MarketingFooter';
import { MarketingNavbar } from './MarketingNavbar';

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[var(--psm-bg)] text-[var(--psm-text)] selection:bg-[var(--psm-primary)]/20 selection:text-[var(--psm-primary)] transition-colors duration-200">
      {/* Universal Ambient Atmosphere Mesh - Continuous Subtle Depth across the Whole Page */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-60 dark:opacity-50">
        {/* Top-right soft orange atmospheric haze */}
        <div className="absolute -top-32 right-[10%] h-[600px] w-[600px] rounded-full bg-[var(--psm-primary)]/10 blur-[140px]" />
        {/* Mid-page blue safety intelligence glow */}
        <div className="absolute top-[35%] left-[5%] h-[650px] w-[650px] rounded-full bg-blue-500/8 blur-[160px]" />
        {/* Lower page emerald barrier integrity glow */}
        <div className="absolute top-[65%] right-[8%] h-[600px] w-[600px] rounded-full bg-emerald-500/8 blur-[150px]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <MarketingNavbar />
        <div className="flex-1">{children}</div>
        <MarketingFooter />
      </div>
    </div>
  );
}
