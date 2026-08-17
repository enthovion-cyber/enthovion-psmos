import { RegulatoryBadge } from './RegulatoryUi';

export function RegulatoryAuditCoverageStatusBadge({ value }: { value?: string | null | undefined }) {
  const tone = value === 'Covered' || value === 'Ready For Audit' ? 'good' : value?.includes('Missing') || value === 'Coverage Gap' || value === 'Not Mapped' ? 'danger' : value === 'Partial' ? 'warn' : 'neutral';
  return <RegulatoryBadge tone={tone}>{value ?? 'Not Mapped'}</RegulatoryBadge>;
}
