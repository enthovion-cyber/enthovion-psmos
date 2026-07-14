import { MarketingRedirectPage } from '@/features/marketing/cta/MarketingRedirectPage';

export default function BuyPlanRoute({ params }: { params: { planCode: string } }) {
  return <MarketingRedirectPage action="checkout" planCode={params.planCode} />;
}
