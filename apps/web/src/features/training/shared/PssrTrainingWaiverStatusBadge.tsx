import { TrainingBadge } from './TrainingUi';

export function PssrTrainingWaiverStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status ?? 'Not Requested';
  const tone = value === 'Approved' ? 'good' : ['Rejected', 'Revoked', 'Expired'].includes(value) ? 'danger' : ['Requested', 'Under Review'].includes(value) ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{value}</TrainingBadge>;
}

