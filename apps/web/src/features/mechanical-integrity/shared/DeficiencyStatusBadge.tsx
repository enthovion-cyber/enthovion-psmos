import { badgeClass } from './badge-utils';

export function DeficiencyStatusBadge({ count, status }: { count?: number | null | undefined; status?: string | null | undefined }) {
  if (status) {
    const tone = status === 'Closed' || status === 'Verified' ? 'success' : status === 'Rejected' || status === 'Cancelled' ? 'neutral' : status === 'Verification Failed' ? 'danger' : status === 'Draft' ? 'neutral' : 'warning';
    return <span className={badgeClass(tone)}>{status}</span>;
  }
  const openCount = count ?? 0;
  return <span className={badgeClass(openCount ? 'warning' : 'success')}>{openCount ? `${openCount} Open` : 'No Open Deficiencies'}</span>;
}
