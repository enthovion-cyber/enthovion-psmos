import { AuditBadge } from './AuditUi';

export function AuditTrendDirectionBadge({ value }: { value?: string | null }) {
  const tone = value === 'Improving' ? 'good' : value === 'Declining' || value === 'Volatile' ? 'danger' : value === 'Stable' ? 'info' : 'neutral';
  return <AuditBadge tone={tone}>{value ?? 'Unknown'}</AuditBadge>;
}
