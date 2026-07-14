import { Badge } from './IncidentStatusBadge';

export function ExposureRouteBadge({ value }: { value?: string }) {
  return <Badge value={value ?? 'No Exposure Route'} />;
}
