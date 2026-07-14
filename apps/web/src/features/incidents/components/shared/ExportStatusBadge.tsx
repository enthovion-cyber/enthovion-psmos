import { Badge } from './IncidentStatusBadge';
export function ExportStatusBadge({ value }: { value?: string | null }) { return <Badge value={value ?? 'Not Requested'} map={{ Completed: 'green', Failed: 'red', Running: 'blue', Requested: 'amber', Archived: 'slate' }} />; }
