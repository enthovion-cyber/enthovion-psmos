import { InterlockFormPage } from '@/features/mechanical-integrity/interlocks/InterlockFormPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function MechanicalIntegrityEditInterlockPage(props: { params: Promise<{ interlockId: string }> }) {
  const params = await props.params;
  return <InterlockFormPage interlockId={params.interlockId} />;
}
