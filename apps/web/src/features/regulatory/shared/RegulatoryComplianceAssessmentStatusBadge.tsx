import { RegulatoryBadge } from './RegulatoryUi';

export function RegulatoryComplianceAssessmentStatusBadge({ status }: { status?: string | null | undefined }) {
  const tone = status === 'Completed' ? 'good' : status === 'Archived' || status === 'Superseded' ? 'neutral' : status === 'Submitted For Review Foundation' || status === 'Review Required' || status === 'Stale' ? 'warn' : 'info';
  return <RegulatoryBadge tone={tone}>{status ?? 'Draft'}</RegulatoryBadge>;
}
