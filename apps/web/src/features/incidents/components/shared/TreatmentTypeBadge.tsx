import { Badge } from './IncidentStatusBadge';

export function TreatmentTypeBadge({ value }: { value?: string }) {
  return <Badge value={value ?? 'No Treatment'} />;
}
