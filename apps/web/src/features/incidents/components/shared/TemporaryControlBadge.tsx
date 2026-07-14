import { Badge } from './IncidentStatusBadge';
export function TemporaryControlBadge({ value }: { value?: boolean | string }) { return <Badge value={value ? 'Temporary Control' : 'Permanent / None'} />; }
