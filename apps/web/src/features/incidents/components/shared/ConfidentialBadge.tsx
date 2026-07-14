import { Badge } from './IncidentStatusBadge';

export function ConfidentialBadge({ value }: { value?: boolean | string }) {
  return <Badge value={value ? 'Confidential' : 'Not Confidential'} />;
}
