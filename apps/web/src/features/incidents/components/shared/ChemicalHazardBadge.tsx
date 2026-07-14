import { Badge } from './IncidentStatusBadge';

export function ChemicalHazardBadge({ value }: { value?: string }) {
  return <Badge value={value ?? 'Hazard Not Classified'} />;
}
