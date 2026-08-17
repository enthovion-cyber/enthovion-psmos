import { RegulatoryBadge } from './RegulatoryUi';

export function RegulatoryAuditReadinessBadge({ value }: { value?: string | null | undefined }) {
  return <RegulatoryBadge tone={value === 'Ready For Audit' ? 'good' : 'warn'}>{value ?? 'Not Ready For Audit'}</RegulatoryBadge>;
}
