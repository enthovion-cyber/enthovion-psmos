import { Badge } from './IncidentStatusBadge';
export function SifStatusBadge({ value }: { value?: string }) { return <Badge value={value ?? 'Not involved'} />; }
