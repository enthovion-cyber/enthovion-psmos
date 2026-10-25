import { InspectionPlanDetailPage } from '@/features/mechanical-integrity/inspection-plans/detail/InspectionPlanDetailPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function InspectionPlanPage(props: { params: Promise<{ planId: string }> }) {
  const params = await props.params;
  return <InspectionPlanDetailPage planId={params.planId} />;
}
