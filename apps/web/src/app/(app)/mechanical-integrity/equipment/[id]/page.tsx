import { EquipmentDetailPage } from '@/features/mechanical-integrity/equipment-detail/EquipmentDetailPage';

export default function MechanicalIntegrityEquipmentDetailPage({ params }: { params: { id: string } }) {
  return <EquipmentDetailPage id={params.id} />;
}
