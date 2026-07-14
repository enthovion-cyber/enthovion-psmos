import { Badge } from './IncidentStatusBadge';

export function ConfidenceLevelBadge({ value }: { value?: string }) {
  return <Badge value={value ?? 'Not set'} map={{ High: 'emerald', Medium: 'blue', Low: 'amber', Disputed: 'red', 'Not set': 'slate' }} />;
}
