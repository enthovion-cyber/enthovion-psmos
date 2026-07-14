import { Badge } from './IncidentStatusBadge';
export function EscalationStatusBadge({ value }: { value: any }) { return <Badge value={value ?? 'None'} />; }
