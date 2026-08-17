import { EquipmentDesignRegistryPage } from '@/features/psi/equipment-design/EquipmentDesignRegistryPage';

export default function MechanicalIntegrityTechnicalDataDesignBasisPage({ params }: { params: { id: string } }) {
  return <EquipmentDesignRegistryPage equipmentId={params.id} />;
}
