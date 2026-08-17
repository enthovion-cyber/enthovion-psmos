import { EquipmentDesignFormPage } from '@/features/psi/equipment-design/EquipmentDesignFormPage';

export default function NewUnitEquipmentDesignBasisPage({ params }: { params: { unitId: string } }) {
  return <EquipmentDesignFormPage unitId={params.unitId} />;
}
