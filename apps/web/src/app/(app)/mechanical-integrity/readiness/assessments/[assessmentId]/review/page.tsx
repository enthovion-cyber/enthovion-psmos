import { ReadinessDetailPage } from '@/features/mechanical-integrity/readiness/ReadinessDetailPage';

export default function ReadinessAssessmentReviewRoute({ params }: { params: { assessmentId: string } }) {
  return <ReadinessDetailPage assessmentId={params.assessmentId} mode="review" />;
}
