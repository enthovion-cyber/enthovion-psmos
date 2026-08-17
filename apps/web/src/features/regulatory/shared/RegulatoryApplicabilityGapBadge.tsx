import { RegulatoryBadge } from './RegulatoryUi';
export function RegulatoryApplicabilityGapBadge({ status, blocking }: { status?: string | null; blocking?: boolean }) { return <RegulatoryBadge tone={blocking ? 'danger' : status === 'Resolved' ? 'good' : 'warn'}>{blocking ? 'Blocking Gap' : status ?? 'Open Gap'}</RegulatoryBadge>; }
