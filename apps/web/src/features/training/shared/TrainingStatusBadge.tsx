import { TrainingBadge } from './TrainingUi';

export function TrainingStatusBadge({ status }: { status?: string | null }) {
  const value = status ?? 'Not Assessed';
  const tone = value === 'Complete' ? 'good' : ['Overdue', 'Blocked'].includes(value) ? 'danger' : ['Incomplete', 'Expiring Soon', 'Pending Verification', 'Not Assessed'].includes(value) ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{value}</TrainingBadge>;
}
