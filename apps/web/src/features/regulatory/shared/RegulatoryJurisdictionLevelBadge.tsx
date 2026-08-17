import { RegulatoryBadge } from './RegulatoryUi';
export function RegulatoryJurisdictionLevelBadge({ level }: { level?: string | null }) { return <RegulatoryBadge tone="info">{level ?? 'Jurisdiction Not Set'}</RegulatoryBadge>; }
