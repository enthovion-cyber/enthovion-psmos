import { Badge } from './IncidentStatusBadge';
export function SubmissionStatusBadge({ value }: { value: any }) { return <Badge value={value ?? 'Not Submitted'} />; }
