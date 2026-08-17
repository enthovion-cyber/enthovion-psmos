import { RemainingLifePage } from '@/features/mechanical-integrity/remaining-life/RemainingLifePage';

export default function CmlRemainingLifePage({ params }: { params: { id: string } }) {
  return <RemainingLifePage equipmentId={params.id} />;
}
