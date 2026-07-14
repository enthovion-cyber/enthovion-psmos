import { Badge } from './IncidentStatusBadge';
export function BarrierTypeBadge({ value }: { value?: string }) { return <Badge value={value ?? 'Unspecified'} />; }
