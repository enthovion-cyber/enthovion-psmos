import { RegulatoryBadge } from './RegulatoryUi';
export function RegulatoryStatusBadge({ status }: { status?: string | null | undefined }) {
  const tone = status === 'Active' || status === 'Effective' ? 'good' : status === 'Archived' || status === 'Superseded' || status === 'Cancelled' ? 'danger' : status === 'Under Review' || status === 'Effective Soon' ? 'warn' : 'neutral';
  return <RegulatoryBadge tone={tone}>{status ?? 'Draft'}</RegulatoryBadge>;
}
