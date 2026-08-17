import { EquipmentDesignRegistryPage } from '@/features/psi/equipment-design/EquipmentDesignRegistryPage';

export default function MechanicalIntegrityEquipmentDesignBasisPage({ params }: { params: { id: string } }) {
  return <EquipmentDesignRegistryPage equipmentId={params.id} />;
}
