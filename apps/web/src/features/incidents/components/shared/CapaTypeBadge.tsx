import { Badge } from './IncidentStatusBadge';
export function CapaTypeBadge({ value }: { value: any }) { return <Badge value={value ?? 'Other'} />; }
