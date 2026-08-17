import { RegulatoryBadge } from './RegulatoryUi';
export function RegulatoryAuthorityStatusBadge({ status }: { status?: string | null }) { return <RegulatoryBadge tone={status === 'Active' ? 'good' : status === 'Archived' ? 'danger' : 'warn'}>{status ?? 'Draft'}</RegulatoryBadge>; }
