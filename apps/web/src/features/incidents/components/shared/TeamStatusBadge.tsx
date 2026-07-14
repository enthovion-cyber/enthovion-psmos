import { Badge } from './IncidentStatusBadge';
export function TeamStatusBadge({ value }: { value?: string }) { return <Badge value={value ?? 'Not Started'} />; }
