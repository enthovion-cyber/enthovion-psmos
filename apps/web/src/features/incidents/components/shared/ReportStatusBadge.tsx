import { Badge } from './IncidentStatusBadge';
export function ReportStatusBadge({ value }: { value?: string | null }) { return <Badge value={value ?? 'Not Started'} map={{ Generated: 'green', Official: 'purple', Published: 'green', Failed: 'red', Archived: 'slate', Superseded: 'amber', Generating: 'blue' }} />; }
