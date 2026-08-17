import { RegulatoryBadge } from './RegulatoryUi';

export function RegulatoryAuditVerificationStatusBadge({ value }: { value?: string | null | undefined }) {
  const tone = value === 'Verified' ? 'good' : value === 'Rejected' ? 'danger' : value === 'Pending Review' ? 'warn' : 'neutral';
  return <RegulatoryBadge tone={tone}>{value ?? 'Not Submitted'}</RegulatoryBadge>;
}
