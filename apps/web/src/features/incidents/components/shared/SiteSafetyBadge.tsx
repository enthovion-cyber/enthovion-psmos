import { Badge } from './IncidentStatusBadge';
export function SiteSafetyBadge({ value }: { value?: string }) { return <Badge value={value ?? 'Not Verified'} />; }
