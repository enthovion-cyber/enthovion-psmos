import { EquipmentCriticalityPage } from '@/features/mechanical-integrity/criticality/equipment/EquipmentCriticalityPage';

export default function Page({ params }: { params: { id: string } }) {
  return <EquipmentCriticalityPage equipmentId={params.id} />;
}
