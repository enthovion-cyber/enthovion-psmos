import { RegulatoryBadge } from './RegulatoryUi';

export function RegulatoryComplianceGapStatusBadge({ status }: { status?: string | null | undefined }) {
  const tone = status === 'Resolved' ? 'good' : status === 'Archived' ? 'neutral' : status === 'Overdue' || status === 'Open' ? 'danger' : status === 'CAPA Open' || status === 'Action Foundation Created' ? 'warn' : 'info';
  return <RegulatoryBadge tone={tone}>{status ?? 'Open'}</RegulatoryBadge>;
}
