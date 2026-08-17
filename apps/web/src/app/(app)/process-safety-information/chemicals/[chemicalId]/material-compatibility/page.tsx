import { MaterialCompatibilityRegistryPage } from '@/features/psi/material-compatibility/MaterialCompatibilityRegistryPage';

export default function ChemicalMaterialCompatibilityRoute({ params }: { params: { chemicalId: string } }) {
  return <MaterialCompatibilityRegistryPage chemicalId={params.chemicalId} />;
}

