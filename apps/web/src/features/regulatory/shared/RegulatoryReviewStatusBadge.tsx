import { RegulatoryBadge } from './RegulatoryUi';
export function RegulatoryReviewStatusBadge({ status }: { status?: string | null | undefined }) {
  const tone = status === 'Review Overdue' || status === 'Rejected Foundation' ? 'danger' : status === 'Review Due' || status === 'Under Review' || status === 'Returned Foundation' ? 'warn' : status === 'Approved Foundation' ? 'good' : 'neutral';
  return <RegulatoryBadge tone={tone}>{status ?? 'Not Required'}</RegulatoryBadge>;
}
