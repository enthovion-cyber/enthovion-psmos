import { Badge } from './IncidentStatusBadge';
export function LinkedRecordStatusBadge({ value }: { value: any }) { return <Badge value={value ?? 'Active'} />; }
