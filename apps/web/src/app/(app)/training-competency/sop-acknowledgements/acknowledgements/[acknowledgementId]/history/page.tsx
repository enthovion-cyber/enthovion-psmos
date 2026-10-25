import { SopAcknowledgementDetailPage } from '@/features/training/sop-ack/SopAcknowledgementDetailPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function Page(props: { params: Promise<{ acknowledgementId: string }> }) {
  const params = await props.params;
  return <SopAcknowledgementDetailPage acknowledgementId={params.acknowledgementId} />;
}
