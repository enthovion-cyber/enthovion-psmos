import { InterlockDetailPage } from '@/features/mechanical-integrity/interlocks/InterlockDetailPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function MechanicalIntegrityInterlockDetailPage(props: { params: Promise<{ interlockId: string }> }) {
  const params = await props.params;
  return <InterlockDetailPage interlockId={params.interlockId} />;
}
