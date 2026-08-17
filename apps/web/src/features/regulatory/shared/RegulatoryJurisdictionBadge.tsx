import { RegulatoryBadge } from './RegulatoryUi';
export function RegulatoryJurisdictionBadge({ jurisdiction }: { jurisdiction?: string | null | undefined }) {
  return <RegulatoryBadge>{jurisdiction ?? 'Not Set'}</RegulatoryBadge>;
}
