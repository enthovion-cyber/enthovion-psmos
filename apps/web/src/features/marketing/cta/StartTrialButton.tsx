import { MarketingCtaButton } from './MarketingCtaButton';

export function StartTrialButton({ className }: { className?: string | undefined }) {
  return <MarketingCtaButton action="trial" planCode="trial" className={className}>Start 14-day free trial</MarketingCtaButton>;
}
