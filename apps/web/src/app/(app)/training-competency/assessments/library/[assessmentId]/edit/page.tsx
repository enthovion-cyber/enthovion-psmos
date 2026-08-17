import { AssessmentFormPage } from '@/features/training/assessments/AssessmentFormPage';

export default function Page({ params }: { params: { assessmentId: string } }) {
  return <AssessmentFormPage assessmentId={params.assessmentId} />;
}
