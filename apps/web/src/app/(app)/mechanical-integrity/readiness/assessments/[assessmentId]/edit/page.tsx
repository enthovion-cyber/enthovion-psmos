import { ReadinessDetailPage } from '@/features/mechanical-integrity/readiness/ReadinessDetailPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function ReadinessAssessmentEditRoute(props: { params: Promise<{ assessmentId: string }> }) {
  const params = await props.params;
  return <ReadinessDetailPage assessmentId={params.assessmentId} mode="edit" />;
}
