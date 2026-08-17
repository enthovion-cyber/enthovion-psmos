import { RegulatoryBadge } from './RegulatoryUi';
export function RegulatoryApplicabilityStatusBadge({ status }: { status?: string | null }) {
  const tone = status === 'Applicable' ? 'good' : status === 'Not Applicable' ? 'neutral' : status === 'Stale Applicability' ? 'danger' : status === 'Partially Applicable' ? 'warn' : 'info';
  return <RegulatoryBadge tone={tone}>{status ?? 'Not Assessed'}</RegulatoryBadge>;
}
