import { badgeClass } from './badge-utils';

export function PartsStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status || 'Not Required';
  const tone = value === 'Available' || value === 'Issued' || value === 'Consumed' || value === 'Not Required' ? 'success' : value === 'Not Available' ? 'danger' : 'warning';
  return <span className={badgeClass(tone)}>{value}</span>;
}
