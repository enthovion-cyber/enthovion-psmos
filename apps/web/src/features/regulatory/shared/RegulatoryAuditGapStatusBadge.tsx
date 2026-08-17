import { RegulatoryBadge } from './RegulatoryUi';

export function RegulatoryAuditGapStatusBadge({ value }: { value?: string | null | undefined }) {
  const tone = value === 'Resolved' ? 'good' : value === 'Archived' ? 'neutral' : value === 'Action Foundation Created' ? 'info' : 'danger';
  return <RegulatoryBadge tone={tone}>{value ?? 'Open'}</RegulatoryBadge>;
}
