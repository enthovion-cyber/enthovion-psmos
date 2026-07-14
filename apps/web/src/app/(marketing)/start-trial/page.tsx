import { MarketingRedirectPage } from '@/features/marketing/cta/MarketingRedirectPage';

export default function StartTrialRoute() {
  return <MarketingRedirectPage action="trial" planCode="trial" />;
}
