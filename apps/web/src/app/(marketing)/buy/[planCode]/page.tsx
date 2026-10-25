import { MarketingRedirectPage } from '@/features/marketing/cta/MarketingRedirectPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function BuyPlanRoute(props: { params: Promise<{ planCode: string }> }) {
  const params = await props.params;
  return <MarketingRedirectPage action="checkout" planCode={params.planCode} />;
}
