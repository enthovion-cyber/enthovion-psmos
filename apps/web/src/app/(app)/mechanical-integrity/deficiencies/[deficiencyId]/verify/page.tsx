import { DeficiencyDetailPage } from '@/features/mechanical-integrity/deficiencies/DeficiencyDetailPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function MechanicalIntegrityVerifyDeficiencyPage(props: { params: Promise<{ deficiencyId: string }> }) {
  const params = await props.params;
  return <DeficiencyDetailPage deficiencyId={params.deficiencyId} mode="verify" />;
}
