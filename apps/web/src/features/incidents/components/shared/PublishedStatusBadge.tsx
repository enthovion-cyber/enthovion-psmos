import { Badge } from './IncidentStatusBadge';
export function PublishedStatusBadge({ value }: { value?: boolean | string | null }) { return <Badge value={value === true || value === 'Published' ? 'Published' : 'Not Published'} map={{ Published: 'green', 'Not Published': 'amber' }} />; }
