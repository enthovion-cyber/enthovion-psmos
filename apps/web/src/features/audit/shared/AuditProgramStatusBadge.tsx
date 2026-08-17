import { AuditBadge } from './AuditUi';
export function AuditProgramStatusBadge({ status }: { status?: string | null }) {
  const value = status ?? 'Draft';
  const tone = value === 'Active' || value === 'Ready For Scheduling' || value === 'Approved' ? 'good' : value.includes('Overdue') || value.includes('Incomplete') || value === 'Archived' ? 'danger' : value.includes('Review') ? 'warn' : 'neutral';
  return <AuditBadge tone={tone}>{value}</AuditBadge>;
}
