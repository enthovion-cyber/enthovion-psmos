import { TrainingCompletionRecordsPage } from '@/features/training/records/completions/TrainingCompletionRecordsPage';

export default function Page() {
  return <TrainingCompletionRecordsPage mode="pending-approval" params={{ approvalStatus: 'Pending Approval' }} />;
}
