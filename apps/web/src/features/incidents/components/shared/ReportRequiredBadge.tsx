import { Badge } from './IncidentStatusBadge';
export function ReportRequiredBadge({ value }: { value: any }) { return <Badge value={value ?? 'Not Determined'} />; }
