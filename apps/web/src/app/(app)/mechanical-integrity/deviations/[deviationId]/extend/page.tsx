import { DeviationDetailPage } from '@/features/mechanical-integrity/deviations/DeviationDetailPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function MechanicalIntegrityExtendDeviationPage(props: { params: Promise<{ deviationId: string }> }) {
  const params = await props.params;
  return <DeviationDetailPage deviationId={params.deviationId} mode="extend" />;
}
