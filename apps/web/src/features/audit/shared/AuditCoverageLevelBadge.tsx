import { AuditBadge } from './AuditUi';
export function AuditCoverageLevelBadge({ value }: { value?: string | null | undefined }) { return <AuditBadge>{value ?? 'Missing'}</AuditBadge>; }
