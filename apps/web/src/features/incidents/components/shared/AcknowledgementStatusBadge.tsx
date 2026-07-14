import { Badge } from './IncidentStatusBadge';
export function AcknowledgementStatusBadge({ value }: { value?: string | null }) { return <Badge value={value ?? 'Not Required'} map={{ Complete: 'green', Acknowledged: 'green', 'Acknowledgement Pending': 'amber', Pending: 'amber', Overdue: 'red', 'Not Required': 'slate' }} />; }
