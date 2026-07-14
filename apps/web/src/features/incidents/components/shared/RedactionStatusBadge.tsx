import { Badge } from './IncidentStatusBadge';
export function RedactionStatusBadge({ value }: { value?: string | null }) { return <Badge value={value ?? 'Backend enforced'} map={{ 'Backend enforced': 'green', Required: 'amber', Redacted: 'purple' }} />; }
