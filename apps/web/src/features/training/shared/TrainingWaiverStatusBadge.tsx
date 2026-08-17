import { TrainingBadge } from './TrainingUi';

export function TrainingWaiverStatusBadge({ value }: { value?: string | null }) {
  const status = value ?? 'Requested';
  const tone = status === 'Approved' ? 'good' : ['Rejected', 'Expired', 'Revoked'].includes(status) ? 'danger' : 'warn';
  return <TrainingBadge tone={tone}>{status}</TrainingBadge>;
}
