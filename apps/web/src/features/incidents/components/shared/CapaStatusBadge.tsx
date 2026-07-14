import { Badge } from './IncidentStatusBadge';
export function CapaStatusBadge({ value }: { value: any }) { return <Badge value={value ?? 'Draft'} />; }
