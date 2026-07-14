import { Badge } from './IncidentStatusBadge';
export function EvidenceClassificationBadge({ value }: { value?: string }) { return <Badge value={value ?? 'Unclassified'} />; }
