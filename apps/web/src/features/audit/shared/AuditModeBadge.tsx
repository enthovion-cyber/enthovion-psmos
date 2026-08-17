import { AuditBadge } from './AuditUi'; export function AuditModeBadge({ value }: { value?: string | null }) { return <AuditBadge tone="info">{value ?? 'Mode not set'}</AuditBadge>; }
