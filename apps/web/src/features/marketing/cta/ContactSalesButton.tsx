import { MarketingCtaButton } from './MarketingCtaButton';

export function ContactSalesButton({ planCode = 'enterprise', className }: { planCode?: string | undefined; className?: string | undefined }) {
  return <MarketingCtaButton action="contact-sales" planCode={planCode} variant="secondary" className={className}>Contact Sales</MarketingCtaButton>;
}
