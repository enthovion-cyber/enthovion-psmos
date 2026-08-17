import { RemainingLifePage } from '@/features/mechanical-integrity/remaining-life/RemainingLifePage';

export default function EquipmentRemainingLifePage({ params }: { params: { id: string } }) {
  return <RemainingLifePage equipmentId={params.id} />;
}
