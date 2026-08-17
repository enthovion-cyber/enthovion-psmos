import { TrainingCompletionRecordsPage } from '@/features/training/records/completions/TrainingCompletionRecordsPage';

export default function Page() {
  return <TrainingCompletionRecordsPage mode="pending-verification" params={{ verificationStatus: 'Pending Verification' }} />;
}
