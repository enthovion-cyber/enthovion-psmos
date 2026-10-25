import { RegulatoryBadge } from './RegulatoryUi';

export function RegulatoryReviewDecisionBadge({ decision }: { decision?: string | null | undefined }) {
  const tone = decision === 'Approve' ? 'good' : decision === 'Approve With Conditions' ? 'info' : decision === 'Reject' ? 'danger' : decision ? 'warn' : 'neutral';
  return <RegulatoryBadge tone={tone}>{decision ?? 'No Decision'}</RegulatoryBadge>;
}
