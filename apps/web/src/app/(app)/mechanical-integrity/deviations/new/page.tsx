import { DeviationFormPage } from '@/features/mechanical-integrity/deviations/DeviationFormPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function MechanicalIntegrityNewDeviationPage(props: { searchParams?: Promise<{ equipmentId?: string }> }) {
  const searchParams = await props.searchParams;
  return <DeviationFormPage preset={{ equipmentId: searchParams?.equipmentId ?? '' }} />;
}
