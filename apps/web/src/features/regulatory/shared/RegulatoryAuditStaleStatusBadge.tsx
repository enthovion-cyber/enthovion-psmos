import { RegulatoryBadge } from './RegulatoryUi';

export function RegulatoryAuditStaleStatusBadge({ value }: { value?: string | null | undefined }) {
  const tone = value === 'Current' ? 'good' : value === 'Stale' || value === 'Superseded' ? 'danger' : value === 'Needs Review' ? 'warn' : 'neutral';
  return <RegulatoryBadge tone={tone}>{value ?? 'Current'}</RegulatoryBadge>;
}
