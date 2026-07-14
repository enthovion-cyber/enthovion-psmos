import { Badge } from './IncidentStatusBadge';
export function DeadlineStatusBadge({ value }: { value: any }) { return <Badge value={value ?? 'No Deadline'} />; }
