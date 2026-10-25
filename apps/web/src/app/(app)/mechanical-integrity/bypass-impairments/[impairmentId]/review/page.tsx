import { ImpairmentDetailPage } from '@/features/mechanical-integrity/impairments/ImpairmentDetailPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function ReviewBypassImpairmentPage(props: { params: Promise<{ impairmentId: string }> }) {
  const params = await props.params;
  return <ImpairmentDetailPage impairmentId={params.impairmentId} />;
}
