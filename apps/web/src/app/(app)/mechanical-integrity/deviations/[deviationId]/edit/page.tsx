import { DeviationFormPage } from '@/features/mechanical-integrity/deviations/DeviationFormPage';

export default function MechanicalIntegrityEditDeviationPage({ params }: { params: { deviationId: string } }) {
  return <DeviationFormPage deviationId={params.deviationId} />;
}
