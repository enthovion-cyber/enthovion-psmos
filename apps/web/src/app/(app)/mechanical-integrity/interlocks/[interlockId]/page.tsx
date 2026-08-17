import { InterlockDetailPage } from '@/features/mechanical-integrity/interlocks/InterlockDetailPage';

export default function MechanicalIntegrityInterlockDetailPage({ params }: { params: { interlockId: string } }) {
  return <InterlockDetailPage interlockId={params.interlockId} />;
}
