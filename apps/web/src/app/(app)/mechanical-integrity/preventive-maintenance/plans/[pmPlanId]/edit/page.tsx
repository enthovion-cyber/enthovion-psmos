import { PmPlanFormPage } from '@/features/mechanical-integrity/preventive-maintenance/PmPlanFormPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function EditPmPlanPage(props: { params: Promise<{ pmPlanId: string }> }) {
  const params = await props.params;
  return <PmPlanFormPage planId={params.pmPlanId} />;
}

