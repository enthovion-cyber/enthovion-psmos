import { Badge } from './IncidentStatusBadge';

export function LopcStatusBadge({ value }: { value?: string }) {
  return <Badge value={value ?? 'LOPC Not Reported'} />;
}
