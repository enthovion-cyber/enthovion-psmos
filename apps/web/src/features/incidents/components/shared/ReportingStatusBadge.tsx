import { Badge } from './IncidentStatusBadge';
export function ReportingStatusBadge({ value }: { value: any }) { return <Badge value={value ?? 'Not Determined'} />; }
