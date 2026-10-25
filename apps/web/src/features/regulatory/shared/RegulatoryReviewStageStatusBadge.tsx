import { RegulatoryBadge } from './RegulatoryUi';

export function RegulatoryReviewStageStatusBadge({ status }: { status?: string | null | undefined }) {
  const tone = status === 'Approved' || status === 'Completed' ? 'good' : status === 'Rejected' || status === 'Overdue' ? 'danger' : status === 'Escalated' || status === 'Returned' ? 'warn' : 'neutral';
  return <RegulatoryBadge tone={tone}>{status ?? 'Not Started'}</RegulatoryBadge>;
}
