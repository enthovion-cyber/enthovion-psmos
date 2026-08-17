import { TrainingBadge } from './TrainingUi';

export function TrainingReviewStatusBadge({ value }: { value?: string | null | undefined }) {
  const status = value ?? 'Draft';
  const tone = status === 'Approved Current' || status === 'Approved' ? 'good' : status === 'Rejected' || status === 'Returned' ? 'danger' : status === 'Pending Review' || status === 'Review Overdue' ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{status}</TrainingBadge>;
}
