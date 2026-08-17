import { RegulatoryBadge } from './RegulatoryUi';
export function RegulatoryApplicabilityStaleBadge({ stale }: { stale?: boolean | null }) { return <RegulatoryBadge tone={stale ? 'danger' : 'good'}>{stale ? 'Stale Applicability' : 'Current'}</RegulatoryBadge>; }
