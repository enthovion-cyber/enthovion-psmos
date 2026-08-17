import { RegulatoryBadge } from './RegulatoryUi';
export function RegulatoryApplicabilityBadge({ status }: { status?: string | null | undefined }) {
  const tone = status === 'Applicable' ? 'good' : status === 'Not Applicable' ? 'neutral' : status?.includes('Review') || status === 'Not Assessed' ? 'warn' : 'info';
  return <RegulatoryBadge tone={tone}>{status ?? 'Not Assessed'}</RegulatoryBadge>;
}
