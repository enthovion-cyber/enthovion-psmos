import { AuditBadge } from './AuditUi';

export function AuditTrendStaleBadge({ value }: { value?: string | null }) {
  const tone = value && value !== 'Current' ? 'danger' : 'good';
  return <AuditBadge tone={tone}>{value ?? 'Current'}</AuditBadge>;
}
