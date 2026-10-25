import { RegulatoryBadge } from './RegulatoryUi';

export function RegulatoryReviewESignBadge({ status }: { status?: string | null | undefined }) {
  const tone = status === 'Completed' ? 'good' : status === 'Failed' ? 'danger' : status === 'Required' || status === 'Pending' ? 'warn' : 'neutral';
  return <RegulatoryBadge tone={tone}>{status ?? 'Not Required'}</RegulatoryBadge>;
}
