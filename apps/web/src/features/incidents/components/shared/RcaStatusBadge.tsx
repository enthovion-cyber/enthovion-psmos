import { Badge } from './IncidentStatusBadge';

export function RcaStatusBadge({ value }: { value?: string }) {
  return <Badge value={value ?? 'Not Started'} map={{ Completed: 'emerald', Approved: 'emerald', Required: 'amber', 'In Progress': 'blue', Rejected: 'red', Reopened: 'amber', 'Not Required': 'slate' }} />;
}
