import { RegulatoryBadge } from './RegulatoryUi';
export function RegulatorySourceTypeBadge({ sourceType }: { sourceType?: string | null | undefined }) {
  return <RegulatoryBadge tone="info">{sourceType ?? 'Not Set'}</RegulatoryBadge>;
}
