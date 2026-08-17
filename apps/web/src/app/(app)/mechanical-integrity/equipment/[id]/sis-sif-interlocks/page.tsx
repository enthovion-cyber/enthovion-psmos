import { SisSifInterlocksTab } from '@/features/mechanical-integrity/equipment-detail/tabs/SisSifInterlocksTab';

export default function EquipmentSisSifInterlocksPage({ params }: { params: { id: string } }) {
  return <SisSifInterlocksTab equipmentId={params.id} />;
}
