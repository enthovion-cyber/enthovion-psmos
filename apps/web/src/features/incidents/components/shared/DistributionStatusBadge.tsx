import { Badge } from './IncidentStatusBadge';
export function DistributionStatusBadge({ value }: { value?: string | null }) { return <Badge value={value ?? 'Not Distributed'} map={{ Distributed: 'green', Sent: 'green', Failed: 'red', Draft: 'slate', 'Not Distributed': 'slate' }} />; }
