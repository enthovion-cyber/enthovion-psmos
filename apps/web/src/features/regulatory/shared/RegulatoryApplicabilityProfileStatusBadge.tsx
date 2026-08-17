import { RegulatoryBadge } from './RegulatoryUi';
export function RegulatoryApplicabilityProfileStatusBadge({ status }: { status?: string | null }) { return <RegulatoryBadge tone={status === 'Active' ? 'good' : status === 'Archived' ? 'danger' : 'warn'}>{status ?? 'Draft'}</RegulatoryBadge>; }
