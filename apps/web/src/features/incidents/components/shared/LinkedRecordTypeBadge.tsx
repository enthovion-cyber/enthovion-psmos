import { Badge } from './IncidentStatusBadge';
export function LinkedRecordTypeBadge({ value }: { value: any }) { return <Badge value={value ?? 'Other'} />; }
