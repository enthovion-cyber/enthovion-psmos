import { badgeClass } from './badge-utils';

export function PsmCriticalBadge({ value }: { value?: boolean | null }) {
  return <span className={badgeClass(value ? 'danger' : 'neutral')}>{value ? 'PSM Critical' : 'Not PSM Critical'}</span>;
}
