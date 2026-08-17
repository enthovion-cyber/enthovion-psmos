import { AuditBadge } from './AuditUi';

export function AuditTrendStatusBadge({ value }: { value?: string | null }) {
  const tone = value === 'Calculated' ? 'good' : value === 'Failed' || value === 'Archived' ? 'danger' : value === 'Calculating' || value === 'Queued' ? 'warn' : 'neutral';
  return <AuditBadge tone={tone}>{value ?? 'Unknown'}</AuditBadge>;
}
