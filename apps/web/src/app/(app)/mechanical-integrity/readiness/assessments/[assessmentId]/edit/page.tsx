import { ReadinessDetailPage } from '@/features/mechanical-integrity/readiness/ReadinessDetailPage';

export default function ReadinessAssessmentEditRoute({ params }: { params: { assessmentId: string } }) {
  return <ReadinessDetailPage assessmentId={params.assessmentId} mode="edit" />;
}
