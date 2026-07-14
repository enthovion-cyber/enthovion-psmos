import { Badge } from './IncidentStatusBadge';

export function InvestigationLevelBadge({ value }: { value?: string | null }) {
  return <Badge value={value ?? 'Not Determined'} />;
}
