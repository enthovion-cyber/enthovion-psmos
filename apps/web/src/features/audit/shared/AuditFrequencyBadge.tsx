import { AuditBadge } from './AuditUi';
export function AuditFrequencyBadge({ value }: { value?: string | null | undefined }) { return <AuditBadge tone={value ? 'info' : 'danger'}>{value ?? 'Missing Frequency'}</AuditBadge>; }
