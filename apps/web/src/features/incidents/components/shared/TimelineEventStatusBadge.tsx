import { Badge } from './IncidentStatusBadge';
export function TimelineEventStatusBadge({ value }: { value?: string }) { return <Badge value={value ?? 'Draft'} />; }
