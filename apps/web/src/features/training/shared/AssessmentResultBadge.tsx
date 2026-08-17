import { TrainingBadge } from './TrainingUi';

export function AssessmentResultBadge({ status }: { status?: string | null | undefined }) {
  const value = status ?? 'Pending';
  const tone = value.includes('Passed') ? 'good' : value.includes('Failed') || value === 'Rejected' || value === 'Expired' ? 'danger' : value.includes('Pending') ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{value}</TrainingBadge>;
}
