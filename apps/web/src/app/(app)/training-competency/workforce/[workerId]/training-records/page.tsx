import { TrainingCompletionRecordsPage } from '@/features/training/records/completions/TrainingCompletionRecordsPage';

export default function Page({ params }: { params: { workerId: string } }) {
  return <TrainingCompletionRecordsPage mode="records" params={{ workerId: params.workerId }} />;
}
