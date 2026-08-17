import { RegulatoryBadge } from './RegulatoryUi';
export function RegulatoryAuthorityTypeBadge({ type }: { type?: string | null }) { return <RegulatoryBadge tone="info">{type ?? 'Authority Not Set'}</RegulatoryBadge>; }
