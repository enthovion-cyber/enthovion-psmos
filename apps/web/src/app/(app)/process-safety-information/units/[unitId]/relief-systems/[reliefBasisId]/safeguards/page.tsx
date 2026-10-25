import { SafeguardRegistryPage } from '@/features/psi/safeguards/SafeguardRegistryPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function UnitReliefSystemSafeguardsPage(props: { params: Promise<{ unitId: string; reliefBasisId: string }> }) {
  const params = await props.params;
  return <SafeguardRegistryPage unitId={params.unitId} preset={{ sourceModule: 'Relief Systems', sourceRecordId: params.reliefBasisId }} />;
}
