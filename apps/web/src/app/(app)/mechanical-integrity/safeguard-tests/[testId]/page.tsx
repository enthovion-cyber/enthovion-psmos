import { SafeguardTestDetailPage } from '@/features/mechanical-integrity/safeguard-tests/SafeguardTestDetailPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function MechanicalIntegritySafeguardTestDetailPage(props: { params: Promise<{ testId: string }> }) {
  const params = await props.params;
  return <SafeguardTestDetailPage testId={params.testId} />;
}
