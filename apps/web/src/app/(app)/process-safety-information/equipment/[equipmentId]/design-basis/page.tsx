import { EquipmentDesignRegistryPage } from '@/features/psi/equipment-design/EquipmentDesignRegistryPage';

export default function EquipmentDesignBasisForEquipmentPage({ params }: { params: { equipmentId: string } }) {
  return <EquipmentDesignRegistryPage equipmentId={params.equipmentId} />;
}
