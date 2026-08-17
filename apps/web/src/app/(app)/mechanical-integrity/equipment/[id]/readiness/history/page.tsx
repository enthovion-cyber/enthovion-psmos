import { FitnessReadinessTab } from '@/features/mechanical-integrity/equipment-detail/tabs/FitnessReadinessTab';

export default function EquipmentReadinessHistoryRoute({ params }: { params: { id: string } }) {
  return <FitnessReadinessTab equipmentId={params.id} />;
}
