import { ReadinessAssessmentForm } from '@/features/mechanical-integrity/readiness/ReadinessAssessmentForm';

export default function NewEquipmentReadinessRoute({ params }: { params: { id: string } }) {
  return <ReadinessAssessmentForm equipmentId={params.id} />;
}
