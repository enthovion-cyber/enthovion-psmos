import { DeviationDetailPage } from '@/features/mechanical-integrity/deviations/DeviationDetailPage';

export default function MechanicalIntegrityDeviationDetailPage({ params }: { params: { deviationId: string } }) {
  return <DeviationDetailPage deviationId={params.deviationId} />;
}
