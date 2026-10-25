import { ProcessChemistryRegistryPage } from '@/features/psi/process-chemistry/ProcessChemistryRegistryPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function UnitProcessChemistryPage(props: { params: Promise<{ unitId: string }> }) {
  const params = await props.params;
  return <ProcessChemistryRegistryPage unitId={params.unitId} />;
}
