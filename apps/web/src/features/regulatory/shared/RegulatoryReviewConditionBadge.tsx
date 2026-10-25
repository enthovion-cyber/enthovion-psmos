import { RegulatoryBadge } from './RegulatoryUi';

export function RegulatoryReviewConditionBadge({ status }: { status?: string | null | undefined }) {
  const tone = status === 'Closed' ? 'good' : status === 'Overdue' ? 'danger' : status === 'Open' || status === 'In Progress' ? 'warn' : 'neutral';
  return <RegulatoryBadge tone={tone}>{status ?? 'No Conditions'}</RegulatoryBadge>;
}
