import { AuditBadge } from './AuditUi';
export function AuditConfigurationHealthBadge({ value }: { value?: string | null | undefined }) {
  const tone = value === 'Complete' || value === 'Ready For Scheduling' ? 'good' : value?.includes('Missing') || value?.includes('Overdue') ? 'danger' : value?.includes('Approval') ? 'warn' : 'neutral';
  return <AuditBadge tone={tone}>{value ?? 'Missing'}</AuditBadge>;
}
