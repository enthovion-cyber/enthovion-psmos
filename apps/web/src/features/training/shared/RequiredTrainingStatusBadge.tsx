import { TrainingBadge } from './TrainingUi';

export function RequiredTrainingStatusBadge({ value }: { value?: string | null | undefined }) {
  const status = value ?? 'Draft';
  const tone = status === 'Approved Current' || status === 'Active' ? 'good' : status === 'Archived' || status === 'Superseded' ? 'danger' : status === 'Pending Review' || status === 'Review Overdue' ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{status}</TrainingBadge>;
}
