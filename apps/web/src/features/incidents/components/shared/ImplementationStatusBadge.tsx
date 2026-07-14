import { Badge } from './IncidentStatusBadge';
export function ImplementationStatusBadge({ value }: { value: any }) { return <Badge value={value ?? 'Not Started'} />; }
