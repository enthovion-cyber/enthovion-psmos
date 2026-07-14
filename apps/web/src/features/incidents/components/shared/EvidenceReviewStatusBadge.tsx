import { Badge } from './IncidentStatusBadge';
export function EvidenceReviewStatusBadge({ value }: { value?: string }) { return <Badge value={value ?? 'Not Reviewed'} />; }
