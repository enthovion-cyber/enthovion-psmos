import { TrainingCompletionRecordsPage } from '@/features/training/records/completions/TrainingCompletionRecordsPage';

export default function Page() {
  return <TrainingCompletionRecordsPage mode="failed-incomplete" params={{ completionStatus: 'Failed,Incomplete' }} />;
}
