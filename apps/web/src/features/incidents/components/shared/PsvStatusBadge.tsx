import { Badge } from './IncidentStatusBadge';
export function PsvStatusBadge({ value }: { value?: string }) { return <Badge value={value ?? 'Not involved'} />; }
