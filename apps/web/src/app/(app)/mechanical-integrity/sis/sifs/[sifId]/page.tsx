import { SifDetailPage } from '@/features/mechanical-integrity/sif/detail/SifDetailPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function MechanicalIntegritySifDetailPage(props: { params: Promise<{ sifId: string }> }) {
  const params = await props.params;
  return <SifDetailPage sifId={params.sifId} />;
}
