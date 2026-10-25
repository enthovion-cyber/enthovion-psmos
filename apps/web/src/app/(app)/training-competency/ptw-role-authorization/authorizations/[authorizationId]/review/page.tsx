import { TrainingSourceReviewPage } from '@/features/training/review/TrainingSourceReviewPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function Page(props: { params: Promise<{ authorizationId: string }> }) {
  const params = await props.params;
  return <TrainingSourceReviewPage sourceModule="PTW Authorization" sourceRecordType="PTW authorization record" sourceRecordId={params.authorizationId} />;
}
