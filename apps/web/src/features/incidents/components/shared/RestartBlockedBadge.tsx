import { Badge } from './IncidentStatusBadge';
export function RestartBlockedBadge({ value }: { value?: boolean }) { return <Badge value={value ? 'Restart Blocked' : 'Restart Not Blocked'} />; }
