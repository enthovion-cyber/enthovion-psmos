import { badgeClass } from './badge-utils';

export function DeviationStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status || 'Draft';
  const tone = value === 'Expired' ? 'danger' : value === 'Expiring Soon' || value === 'Extension Requested' ? 'warning' : value === 'Closed' ? 'success' : value === 'Rejected' || value === 'Cancelled' ? 'neutral' : 'info';
  return <span className={badgeClass(tone)}>{value}</span>;
}
