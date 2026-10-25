import { ElectricalClassificationRegistryPage } from '@/features/psi/electrical-classification/ElectricalClassificationRegistryPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function UnitElectricalClassificationPage(props: { params: Promise<{ unitId: string }> }) {
  const params = await props.params;
  return <ElectricalClassificationRegistryPage unitId={params.unitId} />;
}
