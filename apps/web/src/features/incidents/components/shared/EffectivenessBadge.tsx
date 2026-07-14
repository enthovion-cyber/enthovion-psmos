import { Badge } from './IncidentStatusBadge';
export function EffectivenessBadge({ value }: { value: any }) { return <Badge value={value ?? 'Not Verified'} />; }
