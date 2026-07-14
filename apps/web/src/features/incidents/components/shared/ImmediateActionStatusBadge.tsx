import { Badge } from './IncidentStatusBadge';
export function ImmediateActionStatusBadge({ value }: { value?: string }) { return <Badge value={value ?? 'Not Started'} />; }
