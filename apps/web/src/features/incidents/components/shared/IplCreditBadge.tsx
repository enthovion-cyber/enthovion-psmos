import { Badge } from './IncidentStatusBadge';
export function IplCreditBadge({ value }: { value?: string }) { return <Badge value={value ?? 'Not Determined'} />; }
