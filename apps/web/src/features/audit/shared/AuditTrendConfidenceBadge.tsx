import { AuditBadge } from './AuditUi';

export function AuditTrendConfidenceBadge({ value }: { value?: string | null }) {
  const tone = value === 'High' ? 'good' : value === 'Medium' ? 'info' : value === 'Low' ? 'warn' : 'neutral';
  return <AuditBadge tone={tone}>{value ?? 'Insufficient Data'}</AuditBadge>;
}
