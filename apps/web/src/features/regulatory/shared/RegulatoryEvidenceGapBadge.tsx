import { RegulatoryBadge } from './RegulatoryUi';

export function RegulatoryEvidenceGapBadge({ status }: { status?: string | null | undefined }) {
  const tone = status === 'Resolved' ? 'good' : status === 'Archived' ? 'neutral' : status === 'Action Foundation Created' ? 'info' : 'danger';
  return <RegulatoryBadge tone={tone}>{status ?? 'Open'}</RegulatoryBadge>;
}
