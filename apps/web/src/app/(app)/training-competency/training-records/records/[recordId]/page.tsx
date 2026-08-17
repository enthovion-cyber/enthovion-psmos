import { TrainingCompletionRecordDetailPage } from '@/features/training/records/completions/TrainingCompletionRecordDetailPage';

export default function Page({ params }: { params: { recordId: string } }) {
  return <TrainingCompletionRecordDetailPage recordId={params.recordId} />;
}
