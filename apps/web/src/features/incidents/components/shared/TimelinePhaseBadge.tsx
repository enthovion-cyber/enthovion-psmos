import { Badge } from './IncidentStatusBadge';
export function TimelinePhaseBadge({ value }: { value?: string }) { return <Badge value={value ?? 'Phase Missing'} />; }
