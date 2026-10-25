import { RegulatorySourceReviewPage } from '@/features/regulatory/review/RegulatorySourceReviewPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function Page(props: { params: Promise<{ obligationId: string }> }) {
  const params = await props.params;
  return <RegulatorySourceReviewPage title="Submit Obligation Review" sourcePath={`/regulatory/obligations/${params.obligationId}/review`} submitPath={`/regulatory/obligations/${params.obligationId}/review/submit`} />;
}
