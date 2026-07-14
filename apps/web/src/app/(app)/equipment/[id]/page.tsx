import { EquipmentDetail } from '@/features/equipment/components/EquipmentDetail';

export default function EquipmentDetailPage({ params }: { params: { id: string } }) {
  return <EquipmentDetail id={params.id} />;
}
