import { ReadinessDetailPage } from '@/features/mechanical-integrity/readiness/ReadinessDetailPage';

export default function EquipmentReadinessAssessmentRoute({ params }: { params: { assessmentId: string } }) {
  return <ReadinessDetailPage assessmentId={params.assessmentId} />;
}
