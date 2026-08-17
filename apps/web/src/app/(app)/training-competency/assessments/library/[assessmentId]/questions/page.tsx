import { AssessmentDetailPage } from '@/features/training/assessments/AssessmentDetailPage';

export default function Page({ params }: { params: { assessmentId: string } }) {
  return <AssessmentDetailPage assessmentId={params.assessmentId} />;
}
