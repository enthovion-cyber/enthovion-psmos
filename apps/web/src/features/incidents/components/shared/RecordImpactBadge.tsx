import { Badge } from './IncidentStatusBadge';
export function RecordImpactBadge({ value }: { value: any }) { return <Badge value={value ?? 'No change required'} />; }
