import { TrainingBadge } from './TrainingUi';

export function CertificateVerificationBadge({ status }: { status?: string | null | undefined }) {
  const value = status ?? 'Pending';
  const tone = value === 'Verified' || value === 'Not Required' ? 'good' : value === 'Rejected' || value === 'Needs Correction' ? 'danger' : value === 'Pending' ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{value}</TrainingBadge>;
}
