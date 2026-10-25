import { InspectionPlanFormPage } from '@/features/mechanical-integrity/inspection-plans/InspectionPlanFormPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function EditInspectionPlanPage(props: { params: Promise<{ planId: string }> }) {
  const params = await props.params;
  return <InspectionPlanFormPage planId={params.planId} />;
}
