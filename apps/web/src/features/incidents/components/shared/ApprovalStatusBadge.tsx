import { Badge } from './IncidentStatusBadge';
export function ApprovalStatusBadge({ value }: { value?: string | null }) {
  return <Badge value={value ?? 'Approval Pending'} map={{ Approved: 'green', Rejected: 'red', 'Changes Requested': 'amber', Pending: 'amber', 'Approval Pending': 'amber', Closed: 'green' }} />;
}
