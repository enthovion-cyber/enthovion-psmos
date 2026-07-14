import { Badge } from './IncidentStatusBadge';
export function BarrierPerformanceBadge({ value }: { value?: string }) { return <Badge value={value ?? 'Not determined'} />; }
