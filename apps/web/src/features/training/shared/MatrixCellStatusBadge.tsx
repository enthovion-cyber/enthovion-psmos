import { TrainingBadge } from './TrainingUi';

export function MatrixCellStatusBadge({ value }: { value?: string | null }) {
  const status = value ?? 'Unknown / Not Evaluated';
  const tone = status.includes('Complete') ? 'good' : status.includes('Overdue') || status === 'Blocked' ? 'danger' : status.includes('Missing') || status.includes('Pending') || status.includes('Unknown') ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{status}</TrainingBadge>;
}
