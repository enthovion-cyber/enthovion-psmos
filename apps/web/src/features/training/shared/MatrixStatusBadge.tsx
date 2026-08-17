import { TrainingBadge } from './TrainingUi';

export function MatrixStatusBadge({ value }: { value?: string | null }) {
  const status = value ?? 'Unknown / Not Evaluated';
  const tone = status === 'Complete' ? 'good' : status === 'Blocked' ? 'danger' : status.includes('Incomplete') || status.includes('Unknown') ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{status}</TrainingBadge>;
}
