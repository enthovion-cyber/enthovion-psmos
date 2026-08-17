import { RegulatoryBadge } from './RegulatoryUi';

export function RegulatoryEvidenceReadinessBadge({ status }: { status?: string | null | undefined }) {
  const tone = status === 'Evidence Ready Foundation' || status === 'Evidence Not Required' ? 'good' : status === 'Evidence Missing' || status === 'Stale Evidence' ? 'danger' : status === 'Evidence Restricted' || status === 'Evidence Under Review Foundation' ? 'warn' : 'neutral';
  return <RegulatoryBadge tone={tone}>{status ?? 'Not Assessed'}</RegulatoryBadge>;
}
