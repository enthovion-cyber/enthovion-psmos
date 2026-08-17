import { RequiredTrainingAssessmentsPage } from '@/features/training/assessments/RequiredTrainingAssessmentsPage';

export default function Page({ params }: { params: { trainingId: string } }) {
  return <RequiredTrainingAssessmentsPage trainingId={params.trainingId} />;
}
