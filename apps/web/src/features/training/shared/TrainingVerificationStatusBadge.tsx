import { TrainingBadge } from './TrainingUi';

export function TrainingVerificationStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status ?? 'Not Required';
  const tone = value === 'Verified' || value === 'Overridden' ? 'good' : value === 'Rejected' ? 'danger' : value === 'Pending' || value === 'Needs Correction' ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{value}</TrainingBadge>;
}
