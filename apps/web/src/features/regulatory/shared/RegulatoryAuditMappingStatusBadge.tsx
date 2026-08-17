import { RegulatoryBadge } from './RegulatoryUi';

export function RegulatoryAuditMappingStatusBadge({ value }: { value?: string | null | undefined }) {
  const tone = value === 'Verified' || value === 'Active' ? 'good' : value === 'Rejected' || value === 'Archived' ? 'danger' : value === 'Stale' || value === 'Pending Review' ? 'warn' : 'neutral';
  return <RegulatoryBadge tone={tone}>{value ?? 'Not Set'}</RegulatoryBadge>;
}
