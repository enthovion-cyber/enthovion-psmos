import { CompletionRecordFormPage } from '@/features/training/records/completions/CompletionRecordFormPage';

export default function Page({ params }: { params: { recordId: string } }) {
  return <CompletionRecordFormPage recordId={params.recordId} />;
}
