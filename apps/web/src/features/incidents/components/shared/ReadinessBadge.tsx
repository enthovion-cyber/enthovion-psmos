import { Badge } from './IncidentStatusBadge';

export function ReadinessBadge({ value }: { value?: string | null | undefined }) {
  return <Badge value={value ?? 'Not Ready'} map={{ 'Ready for Review': 'green', Blocked: 'red', 'Needs Review': 'amber', Restricted: 'purple' }} />;
}
