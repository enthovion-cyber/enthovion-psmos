import { CriticalityAssessmentFormPage } from '@/features/mechanical-integrity/criticality/assessment/CriticalityAssessmentFormPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <CriticalityAssessmentFormPage equipmentId={params.id} />;
}
