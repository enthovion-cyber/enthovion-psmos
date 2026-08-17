import { TrainingBadge } from './TrainingUi';

export function EvidenceStatusBadge({ value }: { value?: string | null }) {
  const status = value ?? 'Missing Evidence';
  const tone = status === 'Verified' || status === 'Complete' ? 'good' : status.includes('Missing') ? 'danger' : status.includes('Pending') ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{status}</TrainingBadge>;
}
