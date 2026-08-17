import { RegulatoryBadge } from './RegulatoryUi';

export function RegulatoryComplianceGapSeverityBadge({ severity }: { severity?: string | null | undefined }) {
  const tone = severity === 'Critical' || severity === 'Immediate Action Required' ? 'danger' : severity === 'High' ? 'warn' : severity === 'Low' ? 'good' : 'neutral';
  return <RegulatoryBadge tone={tone}>{severity ?? 'Medium'}</RegulatoryBadge>;
}
