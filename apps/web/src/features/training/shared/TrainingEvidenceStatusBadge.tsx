import { TrainingBadge } from './TrainingUi';

export function TrainingEvidenceStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status ?? 'Not Required';
  const tone = value === 'Verified' || value === 'Provided' ? 'good' : value === 'Missing' || value === 'Rejected' || value === 'Expired' ? 'danger' : value === 'Pending Verification' ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{value}</TrainingBadge>;
}
