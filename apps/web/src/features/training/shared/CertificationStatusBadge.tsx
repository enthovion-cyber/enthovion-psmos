import { TrainingBadge } from './TrainingUi';

export function CertificationStatusBadge({ status }: { status?: string | null }) {
  const value = status ?? 'Not Assessed';
  const tone = value === 'Current' ? 'good' : value === 'Expired' || value === 'Missing' ? 'danger' : value === 'Expiring Soon' || value === 'Pending Verification' ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{value}</TrainingBadge>;
}
