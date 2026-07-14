import { Badge } from './IncidentStatusBadge';

export function InjurySeverityBadge({ value }: { value?: string }) {
  return <Badge value={value ?? 'No Injury Severity'} />;
}
