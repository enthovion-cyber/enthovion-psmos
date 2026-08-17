import { TrainingBadge } from './TrainingUi';

export function AssignmentStatusBadge({ status }: { status?: string | null }) {
  const value = status ?? 'Pending';
  return <TrainingBadge tone={value === 'Active' ? 'good' : value === 'Expired' || value === 'Suspended' || value === 'Removed' ? 'danger' : 'warn'}>{value}</TrainingBadge>;
}
