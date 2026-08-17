import { DeviationDetailPage } from '@/features/mechanical-integrity/deviations/DeviationDetailPage';

export default function MechanicalIntegrityExtendDeviationPage({ params }: { params: { deviationId: string } }) {
  return <DeviationDetailPage deviationId={params.deviationId} mode="extend" />;
}
