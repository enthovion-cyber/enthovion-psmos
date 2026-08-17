import { DeviationDetailPage } from '@/features/mechanical-integrity/deviations/DeviationDetailPage';

export default function MechanicalIntegrityCloseDeviationPage({ params }: { params: { deviationId: string } }) {
  return <DeviationDetailPage deviationId={params.deviationId} mode="close" />;
}
