import { Badge } from './IncidentStatusBadge';
export function BarrierFailureBadge({ value }: { value?: string }) { return <Badge value={value ?? 'No failure recorded'} />; }
