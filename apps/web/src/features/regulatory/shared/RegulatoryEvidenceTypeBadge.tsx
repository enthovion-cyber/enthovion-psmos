import { RegulatoryBadge } from './RegulatoryUi';

export function RegulatoryEvidenceTypeBadge({ type }: { type?: string | null | undefined }) {
  return <RegulatoryBadge tone="info">{type ?? 'Evidence'}</RegulatoryBadge>;
}
