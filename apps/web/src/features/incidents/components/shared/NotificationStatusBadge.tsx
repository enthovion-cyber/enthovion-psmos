import { Badge } from './IncidentStatusBadge';
export function NotificationStatusBadge({ value }: { value: any }) { return <Badge value={value ?? 'Draft'} />; }
