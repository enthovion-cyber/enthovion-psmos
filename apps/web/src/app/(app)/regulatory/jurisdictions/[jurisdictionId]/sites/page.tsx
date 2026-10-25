import { RegulatoryJurisdictionDetailPage } from '@/features/regulatory/jurisdictions/RegulatoryJurisdictionDetailPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function Page(props: { params: Promise<{ jurisdictionId: string }> }) {
  const params = await props.params;
  return <RegulatoryJurisdictionDetailPage jurisdictionId={params.jurisdictionId} section="sites" />;
}
