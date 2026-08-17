import { badgeClass } from './badge-utils';

export function SafetyCriticalBadge({ value }: { value?: boolean | null }) {
  return <span className={badgeClass(value ? 'danger' : 'neutral')}>{value ? 'Safety Critical' : 'Not Safety Critical'}</span>;
}
