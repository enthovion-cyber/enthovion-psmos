import { Badge } from './IncidentStatusBadge';

export function EquipmentStatusBadge({ value }: { value?: string }) {
  return <Badge value={value ?? 'Equipment Status Missing'} />;
}
