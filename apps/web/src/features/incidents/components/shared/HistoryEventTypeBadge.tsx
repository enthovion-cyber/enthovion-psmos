import { Badge } from './IncidentStatusBadge';
export function HistoryEventTypeBadge({ value }: { value?: string | null }) { return <Badge value={value ?? 'Updated'} map={{ Created: 'green', Updated: 'blue', Deleted: 'red', 'Status changed': 'amber', Approved: 'green', Rejected: 'red', Signed: 'purple', Exported: 'blue' }} />; }
