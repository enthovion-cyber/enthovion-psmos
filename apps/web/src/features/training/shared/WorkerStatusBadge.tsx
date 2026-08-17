import { TrainingBadge } from './TrainingUi';

export function WorkerStatusBadge({ status }: { status?: string | null }) {
  const value = status ?? 'Draft';
  return <TrainingBadge tone={value === 'Active' ? 'good' : value === 'Archived' || value === 'Blocked' ? 'danger' : 'warn'}>{value}</TrainingBadge>;
}
