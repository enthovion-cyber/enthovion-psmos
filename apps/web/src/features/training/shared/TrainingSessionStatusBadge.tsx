import { TrainingBadge } from './TrainingUi';

export function TrainingSessionStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status ?? 'Draft';
  const tone = value === 'Completed' ? 'good' : value === 'Cancelled' || value === 'Archived' ? 'danger' : value === 'Scheduled' || value === 'In Progress' ? 'info' : 'neutral';
  return <TrainingBadge tone={tone}>{value}</TrainingBadge>;
}
