import { Badge } from './IncidentStatusBadge';
export function AcceptanceStatusBadge({ value }: { value?: string }) { return <Badge value={value ?? 'Pending'} />; }
