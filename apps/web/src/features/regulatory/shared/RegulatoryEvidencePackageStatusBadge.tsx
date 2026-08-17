import { RegulatoryBadge } from './RegulatoryUi';

export function RegulatoryEvidencePackageStatusBadge({ status }: { status?: string | null | undefined }) {
  const tone = status === 'Prepared' || status === 'Published Foundation' ? 'good' : status === 'Missing Evidence' ? 'danger' : status === 'Under Review' ? 'warn' : 'neutral';
  return <RegulatoryBadge tone={tone}>{status ?? 'Draft'}</RegulatoryBadge>;
}
