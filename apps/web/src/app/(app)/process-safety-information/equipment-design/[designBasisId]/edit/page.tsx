import { EquipmentDesignFormPage } from '@/features/psi/equipment-design/EquipmentDesignFormPage';

export default function EditEquipmentDesignBasisRoute({ params }: { params: { designBasisId: string } }) {
  return <EquipmentDesignFormPage designBasisId={params.designBasisId} />;
}
