import { RegulatoryBadge } from './RegulatoryUi';

export function RegulatoryReviewValidationBadge({ status }: { status?: string | null | undefined }) {
  const tone = status === 'Passed' || status === 'Override Accepted' ? 'good' : status === 'Failed' || status === 'Blocked' ? 'danger' : status === 'Passed With Warnings' ? 'warn' : 'neutral';
  return <RegulatoryBadge tone={tone}>{status ?? 'Not Run'}</RegulatoryBadge>;
}
