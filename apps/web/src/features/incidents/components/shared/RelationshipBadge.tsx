import { Badge } from './IncidentStatusBadge';
export function RelationshipBadge({ value }: { value: any }) { return <Badge value={value ?? 'Related record'} />; }
