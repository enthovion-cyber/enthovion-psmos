import { Badge } from './IncidentStatusBadge';
export function RestrictedBadge({ value }: { value?: boolean | string }) { return <Badge value={value ? 'Restricted' : 'Not Restricted'} />; }
