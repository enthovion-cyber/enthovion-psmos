import { Badge } from './IncidentStatusBadge';
export function EvidenceTypeBadge({ value }: { value?: string }) { return <Badge value={value ?? 'Evidence Type Missing'} />; }
