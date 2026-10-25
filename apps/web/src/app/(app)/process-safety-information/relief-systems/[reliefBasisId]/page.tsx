import { ReliefSystemDetailPage } from '@/features/psi/relief-systems/ReliefSystemDetailPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function ReliefSystemDetailRoute(props: { params: Promise<{ reliefBasisId: string }> }) {
  const params = await props.params;
  return <ReliefSystemDetailPage reliefBasisId={params.reliefBasisId} />;
}
