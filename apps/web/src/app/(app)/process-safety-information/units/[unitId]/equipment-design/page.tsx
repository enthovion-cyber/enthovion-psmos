import { EquipmentDesignRegistryPage } from '@/features/psi/equipment-design/EquipmentDesignRegistryPage';

export default function UnitEquipmentDesignBasisPage({ params }: { params: { unitId: string } }) {
  return <EquipmentDesignRegistryPage unitId={params.unitId} />;
}
