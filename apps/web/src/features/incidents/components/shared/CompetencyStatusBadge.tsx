import { Badge } from './IncidentStatusBadge';
export function CompetencyStatusBadge({ value }: { value?: string }) { return <Badge value={value ?? 'Not Reviewed'} />; }
