import { AuditBadge } from './AuditUi';
export function AuditTypeBadge({ value }: { value?: string | null | undefined }) { return <AuditBadge tone="info">{value ?? 'Missing'}</AuditBadge>; }
