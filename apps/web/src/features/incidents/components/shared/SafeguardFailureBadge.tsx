import { Badge } from './IncidentStatusBadge';

export function SafeguardFailureBadge({ value }: { value?: boolean }) {
  return <Badge value={value ? 'Safeguard Failed' : 'No Failure'} />;
}
