import { RegulatoryBadge } from './RegulatoryUi';

export function RegulatoryEvidenceReviewStatusBadge({ status }: { status?: string | null | undefined }) {
  const tone = status === 'Verified Foundation' || status === 'Verified' ? 'good' : status === 'Rejected' ? 'danger' : status === 'Rework Required' || status === 'Pending Review' ? 'warn' : 'neutral';
  return <RegulatoryBadge tone={tone}>{status ?? 'Not Submitted'}</RegulatoryBadge>;
}
