import { Badge } from './IncidentStatusBadge';
export function PsmIncidentBadge({ value }: { value?: boolean }) { return <Badge value={!!value} />; }
