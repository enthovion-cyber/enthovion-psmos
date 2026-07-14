import { MarketingCtaButton } from './MarketingCtaButton';

export function BuyPlanButton({ planCode, label, className }: { planCode: string; label?: string; className?: string | undefined }) {
  return <MarketingCtaButton action="checkout" planCode={planCode} className={className}>{label ?? `Buy ${planCode}`}</MarketingCtaButton>;
}
