import { Badge } from './IncidentStatusBadge';
export function BlockerSeverityBadge({ value }: { value?: string | null }) {
  return <Badge value={value ?? 'Medium'} map={{ Critical: 'red', High: 'red', Medium: 'amber', Low: 'green' }} />;
}
