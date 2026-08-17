import { MaterialCompatibilityRegistryPage } from '@/features/psi/material-compatibility/MaterialCompatibilityRegistryPage';

export default function UnitMaterialCompatibilityRoute({ params }: { params: { unitId: string } }) {
  return <MaterialCompatibilityRegistryPage unitId={params.unitId} />;
}

