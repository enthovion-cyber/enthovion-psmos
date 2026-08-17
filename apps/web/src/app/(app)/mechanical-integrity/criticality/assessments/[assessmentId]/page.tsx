import { CriticalityAssessmentDetailPage } from '@/features/mechanical-integrity/criticality/detail/CriticalityAssessmentDetailPage';

export default function Page({ params }: { params: { assessmentId: string } }) {
  return <CriticalityAssessmentDetailPage assessmentId={params.assessmentId} />;
}
