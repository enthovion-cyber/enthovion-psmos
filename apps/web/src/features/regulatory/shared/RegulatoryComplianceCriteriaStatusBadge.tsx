import { RegulatoryBadge } from './RegulatoryUi';

export function RegulatoryComplianceCriteriaStatusBadge({ status }: { status?: string | null | undefined }) {
  const tone = status === 'Pass Foundation' || status === 'Not Applicable' ? 'good' : status === 'Fail Foundation' ? 'danger' : status === 'Partial Foundation' || status === 'Evidence Missing' || status === 'Action Required' || status === 'Review Required' ? 'warn' : 'neutral';
  return <RegulatoryBadge tone={tone}>{status ?? 'Not Checked'}</RegulatoryBadge>;
}
