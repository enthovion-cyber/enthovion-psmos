import { TrainingBadge } from './TrainingUi';

export function CertificateExpiryBadge({ status }: { status?: string | null | undefined }) {
  const value = status ?? 'Not Determined';
  const tone = value === 'Current' ? 'good' : value === 'Expired' || value === 'Missing' ? 'danger' : value === 'Expiring Soon' || value === 'Pending Verification' ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{value}</TrainingBadge>;
}
