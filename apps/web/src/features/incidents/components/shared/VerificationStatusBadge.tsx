import { Badge } from './IncidentStatusBadge';
export function VerificationStatusBadge({ value }: { value: any }) { return <Badge value={value ?? 'Not Required'} />; }
