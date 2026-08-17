import { badgeClass } from './badge-utils';

export function WorkOrderStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status || 'Draft';
  const tone = value === 'Closed' || value === 'Verified' ? 'success' : value === 'Rejected' || value === 'Cancelled' ? 'neutral' : value === 'Verification Failed' ? 'danger' : value === 'Overdue' || value.startsWith('Waiting') || value === 'Pending Verification' ? 'warning' : 'info';
  return <span className={badgeClass(tone)}>{value}</span>;
}
