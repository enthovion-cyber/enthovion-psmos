import { TrainingCompletionRecordsPage } from '@/features/training/records/completions/TrainingCompletionRecordsPage';

export default function Page({ params }: { params: { trainingId: string } }) {
  return <TrainingCompletionRecordsPage mode="records" params={{ trainingId: params.trainingId }} />;
}
