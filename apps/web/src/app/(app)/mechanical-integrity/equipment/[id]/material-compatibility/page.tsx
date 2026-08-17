import { MaterialCompatibilityRegistryPage } from '@/features/psi/material-compatibility/MaterialCompatibilityRegistryPage';

export default function MiEquipmentMaterialCompatibilityRoute({ params }: { params: { id: string } }) {
  return <MaterialCompatibilityRegistryPage equipmentId={params.id} />;
}

