import { ElectricalClassificationDetailPage } from '@/features/psi/electrical-classification/ElectricalClassificationDetailPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function ElectricalClassificationDetailRoute(props: { params: Promise<{ classificationId: string }> }) {
  const params = await props.params;
  return <ElectricalClassificationDetailPage classificationId={params.classificationId} />;
}
