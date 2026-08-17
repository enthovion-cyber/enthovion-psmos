import { AuditBadge } from './AuditUi';

export function AuditImprovementOpportunityStatusBadge({ value }: { value?: string | null }) {
  const tone = value === 'Closed' ? 'good' : value === 'Action Foundation Created' || value === 'In Progress' ? 'info' : value === 'Archived' ? 'neutral' : 'warn';
  return <AuditBadge tone={tone}>{value ?? 'Open'}</AuditBadge>;
}
