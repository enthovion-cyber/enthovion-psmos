import { MaterialCompatibilityRegistryPage } from '@/features/psi/material-compatibility/MaterialCompatibilityRegistryPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function ChemicalMaterialCompatibilityRoute(props: { params: Promise<{ chemicalId: string }> }) {
  const params = await props.params;
  return <MaterialCompatibilityRegistryPage chemicalId={params.chemicalId} />;
}

