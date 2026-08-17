import { AuditBadge } from './AuditUi';
export function AuditCriticalityBadge({ value }: { value?: string | null | undefined }) {
  const tone = ['Critical', 'Safety-Critical', 'Regulatory-Critical', 'PSM-Critical'].includes(String(value)) ? 'danger' : value === 'High' ? 'warn' : value === 'Medium' ? 'info' : 'neutral';
  return <AuditBadge tone={tone}>{value ?? 'Missing'}</AuditBadge>;
}
