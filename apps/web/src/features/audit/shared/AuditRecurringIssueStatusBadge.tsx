import { AuditBadge } from './AuditUi';

export function AuditRecurringIssueStatusBadge({ value }: { value?: string | null }) {
  const tone = value === 'Closed' ? 'good' : value === 'Open' || value === 'Reopened' ? 'danger' : value === 'Under Review' ? 'warn' : 'neutral';
  return <AuditBadge tone={tone}>{value ?? 'Open'}</AuditBadge>;
}
