import { TrainingBadge } from './TrainingUi';

export function TrainingDocumentStatusBadge({ value }: { value?: string | null | undefined }) {
  const status = value ?? 'No Document Required';
  const tone = status === 'Current Approved' || status === 'No Document Required' ? 'good' : status === 'Pending Approval' || status === 'Needs Review' ? 'warn' : 'danger';
  return <TrainingBadge tone={tone}>{status}</TrainingBadge>;
}
