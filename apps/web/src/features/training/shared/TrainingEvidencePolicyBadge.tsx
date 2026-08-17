import { TrainingBadge } from './TrainingUi';

export function TrainingEvidencePolicyBadge({ value }: { value?: string | null | undefined }) {
  const status = value ?? 'Missing Evidence Policy';
  return <TrainingBadge tone={status === 'Missing Evidence Policy' ? 'danger' : status === 'No Evidence Required' ? 'neutral' : 'good'}>{status}</TrainingBadge>;
}
