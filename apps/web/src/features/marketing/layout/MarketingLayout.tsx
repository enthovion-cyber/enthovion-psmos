import { MarketingFooter } from './MarketingFooter';
import { MarketingNavbar } from './MarketingNavbar';

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--psm-bg)] text-[var(--psm-text)]">
      <MarketingNavbar />
      {children}
      <MarketingFooter />
    </div>
  );
}
