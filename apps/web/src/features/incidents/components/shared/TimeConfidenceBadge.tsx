import { Badge } from './IncidentStatusBadge';
export function TimeConfidenceBadge({ value }: { value?: string }) { return <Badge value={value ?? 'Confidence Missing'} />; }
