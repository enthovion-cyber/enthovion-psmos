import { RegulatoryBadge } from './RegulatoryUi';

export function RegulatoryEvidenceStatusBadge({ status }: { status?: string | null | undefined }) {
  const tone = status === 'Verified' || status === 'Linked' ? 'good' : status === 'Rejected' || status === 'Missing Source' ? 'danger' : status === 'Pending Review' || status === 'Stale' ? 'warn' : 'neutral';
  return <RegulatoryBadge tone={tone}>{status ?? 'Not Set'}</RegulatoryBadge>;
}
