import { MarketingCtaButton } from './MarketingCtaButton';

export function GetStartedButton({ className }: { className?: string | undefined }) {
  return <MarketingCtaButton action="get-started" className={className}>Get Started</MarketingCtaButton>;
}
