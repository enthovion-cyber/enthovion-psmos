import { RegulatoryBadge } from './RegulatoryUi';
export function RegulatoryComplianceStatusBadge({ status }: { status?: string | null | undefined }) {
  const tone = status === 'Compliant Foundation' ? 'good' : status === 'Non-Compliant Foundation' || status === 'Action Required' ? 'danger' : status === 'Partially Compliant Foundation' || status === 'Evidence Missing' || status === 'Review Required' ? 'warn' : 'neutral';
  return <RegulatoryBadge tone={tone}>{status ?? 'Not Assessed'}</RegulatoryBadge>;
}
