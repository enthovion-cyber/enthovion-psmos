import { AssessmentAttemptPage } from '@/features/training/assessments/AssessmentAttemptPage';

export default function Page({ params }: { params: { attemptId: string } }) {
  return <AssessmentAttemptPage attemptId={params.attemptId} />;
}
