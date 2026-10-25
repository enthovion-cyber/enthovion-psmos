import { PmPlanDetailPage } from '@/features/mechanical-integrity/preventive-maintenance/PmPlanDetailPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function PmPlanPage(props: { params: Promise<{ pmPlanId: string }> }) {
  const params = await props.params;
  return <PmPlanDetailPage planId={params.pmPlanId} />;
}

