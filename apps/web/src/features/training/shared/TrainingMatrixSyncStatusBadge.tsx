import { TrainingBadge } from './TrainingUi';

export function TrainingMatrixSyncStatusBadge({ value }: { value?: string | null | undefined }) {
  const status = value ?? 'Not Linked';
  const tone = status === 'In Sync' ? 'good' : status === 'Failed' || status === 'Out of Sync' ? 'danger' : status === 'Sync Required' || status === 'Pending Review' ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{status}</TrainingBadge>;
}
