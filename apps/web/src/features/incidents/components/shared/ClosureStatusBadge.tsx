import { Badge } from './IncidentStatusBadge';
export function ClosureStatusBadge({ value }: { value?: string | null }) {
  return <Badge value={value ?? 'Not Ready'} map={{ Closed: 'green', 'Ready for Closure': 'green', 'Closure Requested': 'blue', 'Approved for Closure': 'green', 'Closure Rejected': 'red', Reopened: 'amber', 'Not Ready': 'slate' }} />;
}
