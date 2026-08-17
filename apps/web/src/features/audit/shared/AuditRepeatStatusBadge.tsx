import { AuditBadge } from './AuditUi';

export function AuditRepeatStatusBadge({ value }: { value?: string | null }) {
  const tone = value === 'Confirmed Repeat' || value === 'Recurring Issue' ? 'warn' : value === 'Systemic Issue' || value === 'Repeat After CAPA' ? 'danger' : value === 'Not Repeat' || value === 'New Finding' ? 'good' : 'neutral';
  return <AuditBadge tone={tone}>{value ?? 'Needs Review'}</AuditBadge>;
}
