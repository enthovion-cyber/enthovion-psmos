import { RegulatoryBadge } from './RegulatoryUi';

export function RegulatoryReviewStaleBadge({ status }: { status?: string | null | undefined }) {
  const tone = status === 'Current' || !status ? 'good' : status === 'Resolved' ? 'info' : 'danger';
  return <RegulatoryBadge tone={tone}>{status ?? 'Current'}</RegulatoryBadge>;
}
