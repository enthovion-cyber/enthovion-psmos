import { MaterialCompatibilityRegistryPage } from '@/features/psi/material-compatibility/MaterialCompatibilityRegistryPage';

export default function EquipmentMaterialCompatibilityRoute({ params }: { params: { equipmentId: string } }) {
  return <MaterialCompatibilityRegistryPage equipmentId={params.equipmentId} />;
}

