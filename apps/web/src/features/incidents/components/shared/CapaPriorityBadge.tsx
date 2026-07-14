import { Badge } from './IncidentStatusBadge';
export function CapaPriorityBadge({ value }: { value: any }) { return <Badge value={value ?? 'Unassigned'} />; }
